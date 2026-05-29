import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets'
import { UseGuards, Logger, BeforeApplicationShutdown } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { TrackingService } from './tracking.service'
import { WsJwtGuard } from './guards/ws-jwt.guard'
import { DriverStatus, Role, AssignmentStatus } from '@prisma/client'
import type { AuthUser } from '../auth/auth.types'
import { FraudService } from './services/fraud.service'
import { LocationHistoryService } from './services/location-history.service'
import { CustomerNotificationService } from './services/customer-notification.service'

// ─── Event name constants (dot-notation) ──────────────────────────────────────
export const EVENTS = {
  // Driver → Server
  DRIVER_LOCATION_UPDATE:    'driver.location.updated',
  DRIVER_STATUS_CHANGE:      'driver.status.changed',
  DRIVER_ASSIGNMENT_STATUS:  'driver.assignment.status',
  DRIVER_ISSUE_REPORT:       'driver.issue.report',
  CLIENT_SUBSCRIBE_ORDER:    'client.order.subscribe',
  CLIENT_SUBSCRIBE_DRIVER:   'client.driver.subscribe',
  CLIENT_SYNC_REQUEST:       'client.sync.request',

  // Server → Dispatcher
  MAP_DRIVER_LOCATION:       'map.driver.location',
  MAP_DRIVER_STATUS:         'map.driver.status',
  MAP_DRIVER_SIGNAL_LOST:    'map.driver.signal_lost',
  MAP_DRIVER_SIGNAL_RESTORED:'map.driver.signal_restored',
  DRIVER_STUCK:              'driver.stuck.detected',
  ROUTE_DEVIATION:           'order.route.deviation',
  ORDER_DELAYED:             'order.delayed',
  ETA_UPDATED:               'order.eta.updated',

  // Server → Driver
  ASSIGNMENT_CREATED:        'assignment.created',
  ASSIGNMENT_CANCELLED:      'assignment.cancelled',

  // Server → All
  ASSIGNMENT_STATUS_CHANGED: 'assignment.status.changed',
  ORDER_DRIVER_LOCATION:     'order.driver.location',
  ORDER_DRIVER_ARRIVING:     'order.driver.arriving',
  ORDER_DELIVERED:           'order.delivered',
  SYNC_STATE:                'sync.state',
  SERVER_ERROR:              'server.error',

  // Server → User (personal notifications)
  NOTIFICATION_NEW:          'notification.new',
} as const

interface AuthSocket extends Socket {
  data: {
    user: AuthUser
  }
}

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
  },
})
export class TrackingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, BeforeApplicationShutdown {
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(TrackingGateway.name)

  /**
   * Track last ping time per socket to detect ghost connections.
   * Map<socketId, lastPingAt (Unix ms)>
   */
  private readonly lastPing = new Map<string, number>()
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  /** Ghost socket timeout — disconnect sockets silent for > 60s */
  private readonly HEARTBEAT_TIMEOUT_MS = 60_000
  private readonly HEARTBEAT_INTERVAL_MS = 30_000

  /** Per-driver location update rate limit — min 2s between updates */
  private readonly lastLocationUpdate = new Map<string, number>()
  private readonly LOCATION_RATE_LIMIT_MS = 2_000

  /** Redis pub/sub clients for Socket.IO cross-instance broadcasting */
  private pubClient: Redis | null = null
  private subClient: Redis | null = null

  constructor(
    private readonly trackingService:        TrackingService,
    private readonly fraudService:           FraudService,
    private readonly locationHistoryService: LocationHistoryService,
    private readonly customerNotification:   CustomerNotificationService,
    private readonly jwtService:             JwtService,
    private readonly prisma:                 PrismaService,
  ) {}

  // ─── Heartbeat + dead socket cleanup ──────────────────────────────────────

  afterInit() {
    // ── Redis adapter for multi-instance broadcasting ──────────────────────
    const redisOpts = {
      host:     process.env.REDIS_HOST     ?? 'localhost',
      port:     Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    }

    try {
      this.pubClient = new Redis(redisOpts)
      this.subClient = this.pubClient.duplicate()

      Promise.all([this.pubClient.connect(), this.subClient.connect()])
        .then(() => {
          // @WebSocketServer() on a namespaced gateway injects the Namespace, not the root
          // Server. The adapter() setter lives on root Server (namespace.server).
          const s = this.server as unknown as Record<string, unknown>
          const root = (s['server'] ?? s) as Record<string, unknown>
          if (typeof root['adapter'] === 'function') {
            (root['adapter'] as (fn: unknown) => void)(createAdapter(this.pubClient!, this.subClient!))
            this.logger.log('Socket.IO Redis adapter active — multi-instance ready')
          } else {
            this.logger.log('Socket.IO Redis adapter connected — single-instance mode')
          }
        })
        .catch((err) => {
          this.logger.warn(`Redis adapter unavailable — falling back to in-memory: ${String(err)}`)
        })
    } catch (err) {
      this.logger.warn(`Redis adapter init failed — single-instance mode: ${String(err)}`)
    }

    this.heartbeatInterval = setInterval(async () => {
      const now = Date.now()
      // Use .local so we only operate on sockets owned by THIS instance —
      // lastPing is per-instance memory and must not touch remote sockets.
      const sockets = await this.server.local.fetchSockets()

      for (const socket of sockets) {
        const last = this.lastPing.get(socket.id)

        if (!last) {
          // First time we see this socket — record it
          this.lastPing.set(socket.id, now)
          continue
        }

        if (now - last > this.HEARTBEAT_TIMEOUT_MS) {
          this.logger.warn(`[heartbeat] stale socket=${socket.id} — disconnecting`)
          this.lastPing.delete(socket.id)
          socket.disconnect(true)
        }
      }

      // Clean up map entries for already-gone sockets
      for (const [id] of this.lastPing) {
        const exists = sockets.some((s) => s.id === id)
        if (!exists) this.lastPing.delete(id)
      }
    }, this.HEARTBEAT_INTERVAL_MS)
  }

  /** Gracefully notify all connected clients before the process exits. */
  async beforeApplicationShutdown(signal?: string) {
    const sockets = await this.server.fetchSockets().catch(() => [])
    this.logger.log(
      `[gateway] graceful shutdown (${signal ?? 'unknown'}) — notifying ${sockets.length} client(s)`,
    )
    // Tell clients to reconnect in 3s (after the new instance is up)
    this.server.emit(EVENTS.SERVER_ERROR, {
      code: 'SERVER_SHUTDOWN',
      message: 'Server restarting — please reconnect in 3 seconds',
      reconnectIn: 3_000,
    })
    // Give the event time to flush before sockets are closed
    await new Promise<void>((resolve) => setTimeout(resolve, 1_500))
  }

  onGatewayDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    this.pubClient?.quit().catch(() => {})
    this.subClient?.quit().catch(() => {})
  }

  // ─── Connection lifecycle ───────────────────────────────────────────────────

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers?.authorization as string | undefined
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)

    const authToken = client.handshake.auth?.token as string | undefined
    if (authToken) return authToken

    const cookieHeader = client.handshake.headers?.cookie as string | undefined
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/)
      if (match) return decodeURIComponent(match[1])
    }

    return null
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client)
      if (!token) { client.disconnect(true); return }

      const payload = this.jwtService.verify<{ userId: string; role: string }>(token, {
        secret: process.env.JWT_SECRET,
      })

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, phone: true, role: true, createdAt: true },
      })

      if (!user) { client.disconnect(true); return }

      client.data.user = user
      this.lastPing.set(client.id, Date.now())

      // Every authenticated user gets a personal room for notifications
      client.join(`user:${user.id}`)

      // Auto-join role-based rooms
      if (user.role === Role.DISPATCHER || user.role === Role.ADMIN) {
        client.join('dispatchers')
      }

      if (user.role === Role.SELLER) {
        const seller = await this.prisma.seller.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
        if (seller) client.join(`seller:${seller.id}`)
      }

      if (user.role === Role.DRIVER) {
        client.join(`driver:${user.id}`)
        await this.trackingService.setDriverStatus(user.id, DriverStatus.ONLINE)
        this.server.to('dispatchers').emit(EVENTS.MAP_DRIVER_STATUS, {
          driverId: user.id,
          status: DriverStatus.ONLINE,
        })
      }

      this.logger.log(`[connect] ${user.role} ${user.id} (${user.name})`)
    } catch {
      client.disconnect(true)
    }
  }

  async handleDisconnect(client: AuthSocket) {
    this.lastPing.delete(client.id)
    const user = client.data?.user
    if (!user) return

    if (user.role === Role.DRIVER) {
      this.lastLocationUpdate.delete(user.id)
      await this.trackingService.setDriverStatus(user.id, DriverStatus.OFFLINE)
      this.server.to('dispatchers').emit(EVENTS.MAP_DRIVER_STATUS, {
        driverId: user.id,
        status: DriverStatus.OFFLINE,
      })
      this.logger.log(`[disconnect] DRIVER ${user.id}`)
    }
  }

  // ─── Driver → location update ───────────────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(EVENTS.DRIVER_LOCATION_UPDATE)
  async onLocationUpdate(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    payload: {
      lat: number
      lng: number
      heading?: number
      speed?: number
      accuracy?: number
      timestamp: number
    },
  ) {
    const user = client.data.user
    if (user.role !== Role.DRIVER) {
      return { status: 'error', message: 'Only drivers can send location' }
    }

    // ── Per-driver rate limit — discard updates faster than 2s ───────────────
    const now = Date.now()
    const lastUpdate = this.lastLocationUpdate.get(user.id) ?? 0
    if (now - lastUpdate < this.LOCATION_RATE_LIMIT_MS) {
      return { status: 'ok', timestamp: now }
    }
    this.lastLocationUpdate.set(user.id, now)

    // ── Fraud / accuracy check ────────────────────────────────────────────────
    const prevLocation = await this.trackingService.getDriverLocation(user.id)
    const fraudResult = this.fraudService.validateLocation(
      { ...payload, driverId: user.id },
      prevLocation,
    )

    if (!fraudResult.valid) {
      this.logger.warn(`[fraud] driver=${user.id} reason=${fraudResult.reason}`)
      if (fraudResult.severity === 'HIGH') {
        await this.fraudService.flagDriver(user.id, fraudResult.reason!)
      }
      // Still return ok so the driver app doesn't retry — just silently discard
      return { status: 'ok', timestamp: Date.now() }
    }

    // ── Refresh heartbeat — socket is alive ──────────────────────────────────
    this.lastPing.set(client.id, Date.now())

    // ── Cache location in Redis (live position) ───────────────────────────────
    await this.trackingService.cacheLocation(user.id, payload.lat, payload.lng, {
      heading: payload.heading,
      speed: payload.speed,
      accuracy: payload.accuracy,
    })

    // ── Buffer for history DB write (batched every 30s) ───────────────────────
    await this.locationHistoryService.buffer({
      driverId: user.id,
      lat: payload.lat,
      lng: payload.lng,
      heading: payload.heading ?? null,
      speed: payload.speed ?? null,
      accuracy: payload.accuracy ?? null,
      timestamp: payload.timestamp ?? Date.now(),
    })

    const locationEvent = {
      driverId: user.id,
      lat: payload.lat,
      lng: payload.lng,
      heading: payload.heading,
      speed: payload.speed,
      accuracy: payload.accuracy,
      timestamp: payload.timestamp ?? Date.now(),
    }

    // Broadcast to dispatchers
    this.server.to('dispatchers').emit(EVENTS.MAP_DRIVER_LOCATION, locationEvent)

    // Broadcast to anyone subscribed to this driver's room (other dispatchers)
    this.server.to(`driver:${user.id}`).emit(EVENTS.MAP_DRIVER_LOCATION, locationEvent)

    // Broadcast to customer's order tracking room
    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        driverId: user.id,
        status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP] },
      },
      select: { orderId: true },
    })
    if (assignment) {
      this.server
        .to(`order:${assignment.orderId}`)
        .emit(EVENTS.ORDER_DRIVER_LOCATION, locationEvent)

      // Check if driver just crossed the 800m approaching threshold
      const justArriving = await this.customerNotification.checkApproaching(
        payload.lat,
        payload.lng,
        assignment.orderId,
      )
      if (justArriving) {
        this.server
          .to(`order:${assignment.orderId}`)
          .emit(EVENTS.ORDER_DRIVER_ARRIVING, { orderId: assignment.orderId })
      }
    }

    // Acknowledge receipt
    return { status: 'ok', timestamp: Date.now() }
  }

  // ─── Driver → status change ─────────────────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(EVENTS.DRIVER_STATUS_CHANGE)
  async onStatusChange(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { status: 'ONLINE' | 'OFFLINE' },
  ) {
    const user = client.data.user
    if (user.role !== Role.DRIVER) {
      return { status: 'error', message: 'Only drivers can change status' }
    }

    await this.trackingService.setDriverStatus(user.id, payload.status as DriverStatus)

    this.server.to('dispatchers').emit(EVENTS.MAP_DRIVER_STATUS, {
      driverId: user.id,
      status: payload.status,
    })

    return { status: 'ok' }
  }

  // ─── Driver → assignment status update ─────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(EVENTS.DRIVER_ASSIGNMENT_STATUS)
  async onAssignmentStatus(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { assignmentId: string; status: AssignmentStatus },
  ) {
    const user = client.data.user

    const updated = await this.trackingService.updateAssignmentStatus(
      payload.assignmentId,
      payload.status,
      user,
    )

    const event = {
      assignmentId: updated.id,
      orderId: updated.orderId,
      driverId: updated.driverId,
      status: updated.status,
    }

    // Notify dispatchers
    this.server.to('dispatchers').emit(EVENTS.ASSIGNMENT_STATUS_CHANGED, event)

    // Notify customer tracking page
    this.server.to(`order:${updated.orderId}`).emit(EVENTS.ASSIGNMENT_STATUS_CHANGED, event)

    // If delivered, also emit order.delivered
    if (updated.status === AssignmentStatus.DELIVERED) {
      this.server.to(`order:${updated.orderId}`).emit(EVENTS.ORDER_DELIVERED, {
        orderId: updated.orderId,
      })
    }

    return { status: 'ok' }
  }

  // ─── Subscribe to order tracking room ──────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(EVENTS.CLIENT_SUBSCRIBE_ORDER)
  async onSubscribeOrder(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { orderId: string },
  ) {
    const user = client.data.user

    // Customers can only subscribe to their own orders
    if (user.role === Role.USER) {
      const order = await this.prisma.order.findUnique({
        where: { id: payload.orderId },
        select: { userId: true },
      })
      if (!order || order.userId !== user.id) throw new WsException('Forbidden')
    }

    client.join(`order:${payload.orderId}`)

    // Send current driver location immediately if available
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { orderId: payload.orderId },
      select: { driverId: true, status: true },
    })
    if (assignment && assignment.status !== AssignmentStatus.DELIVERED) {
      const loc = await this.trackingService.getDriverLocation(assignment.driverId)
      if (loc) {
        client.emit(EVENTS.ORDER_DRIVER_LOCATION, {
          driverId: assignment.driverId,
          ...loc,
        })
      }
    }

    return { joined: true }
  }

  // ─── Dispatcher → subscribe to specific driver room ────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(EVENTS.CLIENT_SUBSCRIBE_DRIVER)
  async onSubscribeDriver(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { driverId: string },
  ) {
    const user = client.data.user
    if (user.role !== Role.DISPATCHER && user.role !== Role.ADMIN) {
      throw new WsException('Forbidden')
    }

    client.join(`driver:${payload.driverId}`)

    const loc = await this.trackingService.getDriverLocation(payload.driverId)
    if (loc) {
      client.emit(EVENTS.MAP_DRIVER_LOCATION, { driverId: payload.driverId, ...loc })
    }

    return { joined: true }
  }

  // ─── Reconnect sync ─────────────────────────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(EVENTS.CLIENT_SYNC_REQUEST)
  async onSyncRequest(@ConnectedSocket() client: AuthSocket) {
    const user = client.data.user
    if (user.role !== Role.DISPATCHER && user.role !== Role.ADMIN) return

    const drivers = await this.trackingService.getDrivers()

    // Enrich with live Redis locations
    const enriched = await Promise.all(
      drivers.map(async (d) => {
        const loc = await this.trackingService.getDriverLocation(d.id)
        return {
          ...d,
          location: loc ?? d.lastLocation,
        }
      }),
    )

    client.emit(EVENTS.SYNC_STATE, { drivers: enriched })
    return { status: 'ok' }
  }

  // ─── Driver → issue report ─────────────────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(EVENTS.DRIVER_ISSUE_REPORT)
  async onIssueReport(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { assignmentId?: string; issue?: string; type?: string; description?: string },
  ) {
    const user = client.data.user
    if (user.role !== Role.DRIVER) return { status: 'error', message: 'Forbidden' }

    // Driver app sends `issue`; accept both `issue` and legacy `type`
    const issueText = payload.issue ?? payload.type ?? 'Unknown issue'

    this.logger.warn(
      `[issue] driver=${user.id} issue="${issueText}" assignment=${payload.assignmentId ?? 'none'}`,
    )

    // Forward to dispatchers so they can act
    this.server.to('dispatchers').emit('driver.issue.reported', {
      driverId: user.id,
      driverName: user.name,
      assignmentId: payload.assignmentId,
      issue: issueText,
      reportedAt: new Date().toISOString(),
    })

    if (payload.assignmentId) {
      this.trackingService.logAssignmentEvent(payload.assignmentId, 'ISSUE_REPORTED', issueText)
      void this.customerNotification.notifyByAssignment(payload.assignmentId, 'ISSUE_REPORTED')
    }

    return { status: 'ok' }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Called by TrackingService when dispatcher creates an assignment */
  pushNewAssignment(driverId: string, assignment: unknown) {
    this.server.to(`driver:${driverId}`).emit(EVENTS.ASSIGNMENT_CREATED, assignment)
  }

  /** Called by AlertService when a driver is stuck */
  alertDriverStuck(driverId: string, orderId: string, minutesIdle: number) {
    this.server.to('dispatchers').emit(EVENTS.DRIVER_STUCK, { driverId, orderId, minutesIdle })
  }

  /** Called by AlertService when signal is lost */
  alertSignalLost(driverId: string, lastSeenAt: number) {
    this.server.to('dispatchers').emit(EVENTS.MAP_DRIVER_SIGNAL_LOST, { driverId, lastSeenAt })
  }

  /** Called by AlertService when signal is restored */
  alertSignalRestored(driverId: string) {
    this.server.to('dispatchers').emit(EVENTS.MAP_DRIVER_SIGNAL_RESTORED, { driverId })
  }

  /** Called by AlertService for delayed unassigned orders */
  alertOrderDelayed(orderId: string, minutesWaiting: number) {
    this.server.to('dispatchers').emit(EVENTS.ORDER_DELAYED, { orderId, minutesWaiting })
  }

  /** Called by EtaService when ETA is recalculated */
  broadcastEtaUpdate(orderId: string, driverId: string, etaMinutes: number, arrivalTime: Date) {
    const payload = { orderId, driverId, etaMinutes, arrivalTime: arrivalTime.toISOString() }
    this.server.to('dispatchers').emit(EVENTS.ETA_UPDATED, payload)
    this.server.to(`order:${orderId}`).emit(EVENTS.ETA_UPDATED, payload)
  }

  /** Called by NotificationsService to push a notification to a specific user */
  pushNotification(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit(EVENTS.NOTIFICATION_NEW, notification)
  }
}

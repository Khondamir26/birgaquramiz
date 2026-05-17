import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AssignmentStatus, DriverStatus, OrderStatus, Role } from '@prisma/client'
import type { CreateAssignmentDto } from './dto/create-assignment.dto'
import type { AuthUser } from '../auth/auth.types'
import Redis from 'ioredis'
import { CustomerNotificationService } from './services/customer-notification.service'

const LOCATION_TTL_SECONDS = 60 // location expires after 60s of no update

@Injectable()
export class TrackingService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis

  constructor(
    private readonly prisma:                PrismaService,
    private readonly customerNotification:  CustomerNotificationService,
  ) {}

onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    })
    this.redis.connect().catch(() => {
      console.warn('[TrackingService] Redis unavailable — location caching disabled')
    })
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  // ─── Location ──────────────────────────────────────────────────────────────

  async cacheLocation(
    driverId: string,
    lat: number,
    lng: number,
    meta: { heading?: number; speed?: number; accuracy?: number },
  ) {
    const value = JSON.stringify({ lat, lng, ...meta, timestamp: Date.now() })
    const key = `driver:${driverId}:location`
    await this.redis.set(key, value, 'EX', LOCATION_TTL_SECONDS).catch(() => {})
  }

  async getDriverLocation(driverId: string) {
    const raw = await this.redis.get(`driver:${driverId}:location`).catch(() => null)
    if (!raw) return null
    return JSON.parse(raw) as {
      lat: number
      lng: number
      heading?: number
      speed?: number
      accuracy?: number
      timestamp: number
    }
  }

  // ─── Driver status ─────────────────────────────────────────────────────────

  async setDriverStatus(userId: string, status: DriverStatus) {
    const profile = await this.prisma.driverProfile.upsert({
      where: { userId },
      create: { userId, status },
      update: { status, lastSeenAt: new Date() },
    })

    if (status === DriverStatus.OFFLINE) {
      // Persist last known location to DB on going offline
      const loc = await this.getDriverLocation(userId)
      if (loc) {
        await this.prisma.driverProfile.update({
          where: { userId },
          data: { lastLat: loc.lat, lastLng: loc.lng },
        })
      }
    }

    return profile
  }

  async getDriverProfile(userId: string) {
    return this.prisma.driverProfile.findUnique({ where: { userId } })
  }

  // ─── Driver list (dispatcher) ───────────────────────────────────────────────

  async getDrivers() {
    const drivers = await this.prisma.user.findMany({
      where: { role: Role.DRIVER },
      select: {
        id: true,
        name: true,
        phone: true,
        driverProfile: {
          select: { status: true, lastLat: true, lastLng: true, lastSeenAt: true },
        },
        assignments: {
          where: { status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP] } },
          take: 1,
          select: { id: true, orderId: true },
        },
        _count: {
          select: {
            assignments: {
              where: {
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
              },
            },
          },
        },
      },
    })

    return drivers.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      status: d.driverProfile?.status ?? DriverStatus.OFFLINE,
      lastLocation:
        d.driverProfile?.lastLat != null
          ? {
              lat: d.driverProfile.lastLat,
              lng: d.driverProfile.lastLng!,
              timestamp: d.driverProfile.lastSeenAt?.getTime() ?? 0,
            }
          : undefined,
      assignmentsToday: d._count.assignments,
      activeAssignmentId: d.assignments[0]?.id ?? undefined,
      activeOrderId: d.assignments[0]?.orderId ?? undefined,
    }))
  }

  // ─── Driver detail (dispatcher panel) ─────────────────────────────────────

  async getDriverDetail(driverId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: driverId, role: Role.DRIVER },
      select: {
        id: true,
        name: true,
        phone: true,
        telegramPhoto: true,
        createdAt: true,
        driverProfile: {
          select: { status: true, lastLat: true, lastLng: true, lastSeenAt: true },
        },
        assignments: {
          where: { status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP] } },
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            order: {
              select: {
                id: true,
                customerName: true,
                customerPhone: true,
                deliveryAddress: true,
                total: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignments: { where: { status: AssignmentStatus.DELIVERED } },
            fraudEvents: true,
          },
        },
      },
    })

    if (!user) throw new NotFoundException('Driver not found')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const assignmentsToday = await this.prisma.deliveryAssignment.count({
      where: { driverId, createdAt: { gte: today } },
    })

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      photo: user.telegramPhoto ?? null,
      status: user.driverProfile?.status ?? DriverStatus.OFFLINE,
      lastSeenAt: user.driverProfile?.lastSeenAt ?? null,
      lastLat: user.driverProfile?.lastLat ?? null,
      lastLng: user.driverProfile?.lastLng ?? null,
      memberSince: user.createdAt,
      activeAssignment: user.assignments[0] ?? null,
      stats: {
        assignmentsToday,
        totalDelivered: user._count.assignments,
        fraudCount: user._count.fraudEvents,
      },
    }
  }

  // ─── Orders available for assignment (dispatcher) ──────────────────────────

  async getAssignableOrders() {
    return this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.CONFIRMED] },
        assignment: null,
        deliveryType: 'DELIVERY',
      },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        deliveryAddress: true,
        total: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  // ─── Assignments ────────────────────────────────────────────────────────────

  async createAssignment(dto: CreateAssignmentDto, dispatcher: AuthUser) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const assignment = await this.prisma.$transaction(async (tx) => {
          // 1. Lock-read the order inside the transaction
          const order = await tx.order.findUnique({
            where: { id: dto.orderId },
            include: { assignment: true },
          })
          if (!order) throw new NotFoundException('Order not found')
          if (order.assignment) throw new BadRequestException('Order already has an assignment')
          if (order.status !== OrderStatus.CONFIRMED) {
            throw new BadRequestException('Order must be CONFIRMED before assigning a driver')
          }

          // 2. Validate driver inside transaction
          const driver = await tx.user.findUnique({ where: { id: dto.driverId } })
          if (!driver || driver.role !== Role.DRIVER) {
            throw new BadRequestException('Invalid driver')
          }

          // 3. Check driver has no active delivery inside transaction
          const activeAssignment = await tx.deliveryAssignment.findFirst({
            where: {
              driverId: dto.driverId,
              status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP] },
            },
          })
          if (activeAssignment) {
            throw new BadRequestException('Driver already has an active delivery')
          }

          // 4. Create assignment + update order atomically
          const created = await tx.deliveryAssignment.create({
            data: {
              orderId: dto.orderId,
              driverId: dto.driverId,
              dispatcherId: dispatcher.id,
              note: dto.note,
            },
            include: {
              order: {
                select: {
                  id: true,
                  customerName: true,
                  customerPhone: true,
                  deliveryAddress: true,
                  total: true,
                  status: true,
                  createdAt: true,
                  _count: { select: { items: true } },
                },
              },
            },
          })

          await tx.order.update({
            where: { id: dto.orderId },
            data: { driverId: dto.driverId, status: OrderStatus.SHIPPED },
          })

          return created
        })

        void this.customerNotification.notify(dto.orderId, 'ASSIGNMENT_CREATED')
        this.logAssignmentEvent(assignment.id, 'CREATED')
        return assignment
      } catch (err: unknown) {
        // Retry only on Prisma serialization/write-conflict errors
        if (attempt < 3 && (err as { code?: string })?.code === 'P2034') {
          await new Promise((r) => setTimeout(r, 50 * attempt))
          continue
        }
        throw err
      }
    }
    // Unreachable — loop always returns or throws
    throw new Error('createAssignment: unreachable')
  }

  async updateAssignmentStatus(
    assignmentId: string,
    status: AssignmentStatus,
    user: AuthUser,
  ) {
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
      include: { order: true },
    })

    if (!assignment) throw new NotFoundException('Assignment not found')

    // Only the assigned driver can update, or a dispatcher/admin can cancel
    const isDriver = user.id === assignment.driverId
    const isDispatcherOrAdmin =
      user.role === Role.DISPATCHER || user.role === Role.ADMIN

    if (!isDriver && !isDispatcherOrAdmin) {
      throw new ForbiddenException('Not authorized to update this assignment')
    }

    // Validate status transitions
    this.validateTransition(assignment.status, status)

    const updated = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryAssignment.update({
        where: { id: assignmentId },
        data: { status },
      })

      // Sync order status
      if (status === AssignmentStatus.DELIVERED) {
        await tx.order.update({
          where: { id: assignment.orderId },
          data: { status: OrderStatus.DELIVERED },
        })
        // Driver goes back to ONLINE
        await tx.driverProfile.updateMany({
          where: { userId: assignment.driverId },
          data: { status: DriverStatus.ONLINE },
        })
        void this.customerNotification.notify(assignment.orderId, 'DELIVERED')
      } else if (status === AssignmentStatus.ACCEPTED) {
        await tx.driverProfile.updateMany({
          where: { userId: assignment.driverId },
          data: { status: DriverStatus.ON_DELIVERY },
        })
      } else if (status === AssignmentStatus.PICKED_UP) {
        void this.customerNotification.notify(assignment.orderId, 'PICKED_UP')
      } else if (status === AssignmentStatus.CANCELLED) {
        await tx.order.update({
          where: { id: assignment.orderId },
          data: { status: OrderStatus.CONFIRMED, driverId: null },
        })
        await tx.driverProfile.updateMany({
          where: { userId: assignment.driverId },
          data: { status: DriverStatus.ONLINE },
        })
      }

      return updated
    })

    this.logAssignmentEvent(assignmentId, status)
    return { ...updated, orderId: assignment.orderId, driverId: assignment.driverId }
  }

  async getAssignmentByOrder(orderId: string) {
    return this.prisma.deliveryAssignment.findUnique({
      where: { orderId },
      include: {
        order: { select: { deliveryAddress: true } },
        driver: { select: { id: true, name: true, phone: true } },
        dispatcher: { select: { id: true, name: true } },
      },
    })
  }

  async getMyAssignments(driverId: string) {
    return this.prisma.deliveryAssignment.findMany({
      where: {
        driverId,
        status: { in: [AssignmentStatus.PENDING, AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP] },
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            deliveryAddress: true,
            total: true,
            status: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  // ─── Assignment event log ───────────────────────────────────────────────────

  /** Fire-and-forget — never throws, never blocks the caller */
  logAssignmentEvent(assignmentId: string, event: string, note?: string): void {
    this.prisma.assignmentEvent
      .create({ data: { assignmentId, event, note } })
      .catch(() => {})
  }

  async getAssignmentEvents(assignmentId: string) {
    return this.prisma.assignmentEvent.findMany({
      where: { assignmentId },
      orderBy: { createdAt: 'asc' },
    })
  }

  // ─── Public tracking helpers ───────────────────────────────────────────────

  /** Returns the POD photo URL from AssignmentEvents, or null if not uploaded yet. */
  async getPodPhotoUrl(assignmentId: string): Promise<string | null> {
    const ev = await this.prisma.assignmentEvent.findFirst({
      where:   { assignmentId, event: 'POD_UPLOADED' },
      select:  { note: true },
      orderBy: { createdAt: 'desc' },
    })
    return ev?.note ?? null
  }

  /** Returns customer-facing milestone timestamps from AssignmentEvents. */
  async getAssignmentMilestones(assignmentId: string): Promise<Record<string, string>> {
    const events = await this.prisma.assignmentEvent.findMany({
      where: { assignmentId, event: { in: ['ACCEPTED', 'PICKED_UP', 'DELIVERED'] } },
      select: { event: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    const result: Record<string, string> = {}
    for (const ev of events) result[ev.event] = ev.createdAt.toISOString()
    return result
  }

  // ─── Driver performance stats ──────────────────────────────────────────────

  async getDriverStats(driverId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000)

    const [
      total30,
      cancelled30,
      deliveredLast30,
      issueCount,
      allTimeDelivered,
      allTimeCancelled,
      totalAll,
    ] = await Promise.all([
      this.prisma.deliveryAssignment.count({
        where: { driverId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.deliveryAssignment.count({
        where: { driverId, status: AssignmentStatus.CANCELLED, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.deliveryAssignment.findMany({
        where: { driverId, status: AssignmentStatus.DELIVERED, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, updatedAt: true },
      }),
      this.prisma.assignmentEvent.count({
        where: { event: 'ISSUE_REPORTED', assignment: { driverId } },
      }),
      this.prisma.deliveryAssignment.count({
        where: { driverId, status: AssignmentStatus.DELIVERED },
      }),
      this.prisma.deliveryAssignment.count({
        where: { driverId, status: AssignmentStatus.CANCELLED },
      }),
      this.prisma.deliveryAssignment.count({ where: { driverId } }),
    ])

    const delivered30 = deliveredLast30.length

    const avgDeliveryMinutes =
      delivered30 > 0
        ? Math.round(
            deliveredLast30.reduce(
              (sum, a) => sum + (a.updatedAt.getTime() - a.createdAt.getTime()),
              0,
            ) /
              delivered30 /
              60_000,
          )
        : null

    return {
      period: '30d' as const,
      total30,
      delivered30,
      cancelled30,
      acceptanceRate: total30 > 0 ? Math.round(((total30 - cancelled30) / total30) * 100) : null,
      cancellationRate: total30 > 0 ? Math.round((cancelled30 / total30) * 100) : null,
      avgDeliveryMinutes,
      issueCount,
      issueRate: delivered30 > 0 ? Math.round((issueCount / delivered30) * 100) / 100 : null,
      allTime: { total: totalAll, delivered: allTimeDelivered, cancelled: allTimeCancelled },
    }
  }

  async getDriverAssignmentHistory(driverId: string, limit = 10, cursor?: string) {
    return this.prisma.deliveryAssignment.findMany({
      where: { driverId },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        order: {
          select: {
            id: true,
            customerName: true,
            deliveryAddress: true,
            total: true,
          },
        },
        _count: { select: { events: true } },
      },
    })
  }

  // ─── Customer ratings ──────────────────────────────────────────────────────

  async submitRating(
    orderId: string,
    dto: { rating: number; comment?: string; tags: string[] },
  ) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5')
    }

    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { orderId },
    })
    if (!assignment) throw new NotFoundException('Assignment not found')
    if (assignment.status !== AssignmentStatus.DELIVERED) {
      throw new BadRequestException('Order must be delivered before rating')
    }

    const existing = await this.prisma.deliveryRating.findUnique({
      where: { orderId },
      select: { id: true },
    })
    if (existing) throw new BadRequestException('Order already rated')

    await this.prisma.deliveryRating.create({
      data: {
        orderId,
        assignmentId: assignment.id,
        driverId:     assignment.driverId,
        rating:       dto.rating,
        comment:      dto.comment,
        tags:         dto.tags,
      },
    })
    return { success: true }
  }

  async hasRating(orderId: string): Promise<boolean> {
    const r = await this.prisma.deliveryRating.findUnique({
      where:  { orderId },
      select: { id: true },
    })
    return !!r
  }

  async getDriverRatingSummary(driverId: string) {
    const ratings = await this.prisma.deliveryRating.findMany({
      where:  { driverId },
      select: { rating: true, tags: true },
    })

    if (ratings.length === 0) {
      return { count: 0, average: null, distribution: {}, topTags: [] }
    }

    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    const tagCount: Record<string, number> = {}
    let sum = 0

    for (const r of ratings) {
      sum += r.rating
      distribution[String(r.rating)] = (distribution[String(r.rating)] ?? 0) + 1
      for (const tag of r.tags) {
        tagCount[tag] = (tagCount[tag] ?? 0) + 1
      }
    }

    return {
      count:        ratings.length,
      average:      Math.round((sum / ratings.length) * 10) / 10,
      distribution,
      topTags:      Object.entries(tagCount)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([tag, count]) => ({ tag, count })),
    }
  }

  // ─── Fraud events ────────────────────────────────────────────────────────────

  async getRecentFraudEvents(limit = 200) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000)
    return this.prisma.fraudEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        driver: { select: { name: true, phone: true } },
      },
    })
  }

  async deleteFraudEvent(id: string): Promise<void> {
    await this.prisma.fraudEvent.delete({ where: { id } }).catch(() => {})
  }

  async clearFraudEvents(): Promise<void> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000)
    await this.prisma.fraudEvent.deleteMany({ where: { createdAt: { gte: since } } })
  }

  // ─── Dispatcher order detail ─────────────────────────────────────────────────

  async getOrderDetailForDispatcher(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    })
    if (!order) throw new NotFoundException('Order not found')
    return order
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private validateTransition(current: AssignmentStatus, next: AssignmentStatus) {
    const allowed: Record<AssignmentStatus, AssignmentStatus[]> = {
      [AssignmentStatus.PENDING]: [AssignmentStatus.ACCEPTED, AssignmentStatus.CANCELLED],
      [AssignmentStatus.ACCEPTED]: [AssignmentStatus.PICKED_UP, AssignmentStatus.CANCELLED],
      [AssignmentStatus.PICKED_UP]: [AssignmentStatus.DELIVERED, AssignmentStatus.CANCELLED],
      [AssignmentStatus.DELIVERED]: [],
      [AssignmentStatus.CANCELLED]: [],
    }

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Cannot transition assignment from ${current} to ${next}`,
      )
    }
  }
}

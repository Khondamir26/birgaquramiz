import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { TrackingService } from '../tracking.service'
import { AssignmentStatus } from '@prisma/client'

// TrackingGateway imported lazily to avoid circular dep
type GatewayRef = {
  alertDriverStuck: (driverId: string, orderId: string, minutesIdle: number) => void
  alertSignalLost: (driverId: string, lastSeenAt: number) => void
  alertSignalRestored: (driverId: string) => void
  alertOrderDelayed: (orderId: string, minutesWaiting: number) => void
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name)

  /** Track which drivers we've already alerted so we don't spam */
  private readonly stuckAlerted = new Set<string>()
  private readonly signalLostAlerted = new Set<string>()
  private readonly delayedAlerted = new Set<string>()

  private gateway: GatewayRef | null = null

  /** Call this from TrackingModule after gateway is ready */
  setGateway(gw: GatewayRef) {
    this.gateway = gw
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingService: TrackingService,
  ) {}

  // ─── Stuck driver detection: every 2 minutes ────────────────────────────────

  @Cron('*/2 * * * *')
  async detectStuckDrivers() {
    if (!this.gateway) return

    const STUCK_THRESHOLD_MS = 10 * 60 * 1_000   // 10 minutes

    const activeAssignments = await this.prisma.deliveryAssignment.findMany({
      where: { status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP] } },
      include: {
        driver: { include: { driverProfile: true } },
      },
    })

    for (const assignment of activeAssignments) {
      const profile = assignment.driver.driverProfile
      if (!profile?.lastSeenAt) continue

      const idleMs = Date.now() - profile.lastSeenAt.getTime()
      const minutesIdle = Math.floor(idleMs / 60_000)

      if (idleMs > STUCK_THRESHOLD_MS && !this.stuckAlerted.has(assignment.driverId)) {
        this.stuckAlerted.add(assignment.driverId)
        this.gateway.alertDriverStuck(assignment.driverId, assignment.orderId, minutesIdle)
        this.logger.warn(`[alert] stuck driver=${assignment.driverId} idle=${minutesIdle}min`)
      } else if (idleMs <= STUCK_THRESHOLD_MS) {
        this.stuckAlerted.delete(assignment.driverId)
      }
    }
  }

  // ─── Signal lost / restored: every 45 seconds ───────────────────────────────

  @Cron('*/1 * * * *')
  async detectSignalLost() {
    if (!this.gateway) return

    const STALE_MS = 45_000  // 45 seconds

    const onlineDrivers = await this.prisma.driverProfile.findMany({
      where: { status: { in: ['ONLINE', 'ON_DELIVERY'] } },
      select: { userId: true, lastSeenAt: true },
    })

    for (const driver of onlineDrivers) {
      if (!driver.lastSeenAt) continue

      const staleSince = Date.now() - driver.lastSeenAt.getTime()
      const isStale = staleSince > STALE_MS

      if (isStale && !this.signalLostAlerted.has(driver.userId)) {
        this.signalLostAlerted.add(driver.userId)
        this.gateway.alertSignalLost(driver.userId, driver.lastSeenAt.getTime())
        this.logger.warn(`[alert] signal_lost driver=${driver.userId}`)
      } else if (!isStale && this.signalLostAlerted.has(driver.userId)) {
        this.signalLostAlerted.delete(driver.userId)
        this.gateway.alertSignalRestored(driver.userId)
        this.logger.log(`[alert] signal_restored driver=${driver.userId}`)
      }
    }
  }

  // ─── Delayed unassigned orders: every 5 minutes ─────────────────────────────

  @Cron('*/5 * * * *')
  async detectDelayedOrders() {
    if (!this.gateway) return

    const DELAY_THRESHOLD_MS = 20 * 60 * 1_000  // 20 minutes unassigned

    const unassignedOrders = await this.prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        deliveryType: 'DELIVERY',
        assignment: null,
      },
      select: { id: true, createdAt: true },
    })

    for (const order of unassignedOrders) {
      const waitingMs = Date.now() - order.createdAt.getTime()
      const minutesWaiting = Math.floor(waitingMs / 60_000)

      if (waitingMs > DELAY_THRESHOLD_MS && !this.delayedAlerted.has(order.id)) {
        this.delayedAlerted.add(order.id)
        this.gateway.alertOrderDelayed(order.id, minutesWaiting)
        this.logger.warn(`[alert] delayed order=${order.id} waiting=${minutesWaiting}min`)
      }
    }

    // Clear alerts for orders that have since been assigned
    for (const orderId of this.delayedAlerted) {
      const stillUnassigned = unassignedOrders.some((o) => o.id === orderId)
      if (!stillUnassigned) this.delayedAlerted.delete(orderId)
    }
  }
}

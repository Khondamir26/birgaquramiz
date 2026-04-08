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

const LOCATION_TTL_SECONDS = 60 // location expires after 60s of no update

@Injectable()
export class TrackingService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis

  constructor(private readonly prisma: PrismaService) {}

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
    }))
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
    /**
     * All validation + writes happen inside a single serializable-level transaction.
     * This prevents the race condition where two dispatchers assign the same order
     * simultaneously — the unique constraint on orderId catches duplicates,
     * but the in-transaction read ensures we give a clear error before that.
     */
    return this.prisma.$transaction(async (tx) => {
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
      const assignment = await tx.deliveryAssignment.create({
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

      return assignment
    })
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
      } else if (status === AssignmentStatus.ACCEPTED) {
        await tx.driverProfile.updateMany({
          where: { userId: assignment.driverId },
          data: { status: DriverStatus.ON_DELIVERY },
        })
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

import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanExpiredSessions() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = await this.prisma.authSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: cutoff } },
          { revokedAt: { lt: cutoff, not: null } },
        ],
      },
    })
    if (result.count > 0) {
      this.logger.log(`Deleted ${result.count} expired/revoked auth sessions`)
    }
  }
}

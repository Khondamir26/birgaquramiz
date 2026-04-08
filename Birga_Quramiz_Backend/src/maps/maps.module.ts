import { Module } from '@nestjs/common'
import { GeocodingService } from './geocoding.service'
import { RouteCacheService } from './route-cache.service'
import { EtaService } from './eta.service'

@Module({
  providers: [GeocodingService, RouteCacheService, EtaService],
  exports: [GeocodingService, RouteCacheService, EtaService],
})
export class MapsModule {}

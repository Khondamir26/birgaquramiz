/** Shared geo math utilities */

export interface LatLng {
  lat: number
  lng: number
}

/** Haversine distance in metres */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))
}

/** Round lat/lng to N decimal places for cache key grid cells (~11m at 4dp, ~110m at 3dp) */
export function toGridCell(coord: LatLng, precision = 3): string {
  return `${coord.lat.toFixed(precision)},${coord.lng.toFixed(precision)}`
}

/** Simple MD5-like stable hash for strings (uses built-in crypto) */
export function stableHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

import Image from "next/image"

interface BrandLogoProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  width?: number
  height?: number
}

/**
 * BrandLogo component that intelligently chooses between Next.js Image 
 * (for optimized internal/whitelisted assets) and standard img 
 * (for external arbitrary URLs) to avoid security risks and config errors.
 */
export default function BrandLogo({ src, alt, fill, className, width, height }: BrandLogoProps) {
  // Check if it's a whitelisted internal/API source
  const isWhitelisted = 
    !src.startsWith('http') || 
    src.includes('api.birga-quramiz.uz') || 
    src.includes('localhost') || 
    src.includes('127.0.0.1')

  if (isWhitelisted) {
    return (
      <Image 
        src={src} 
        alt={alt} 
        fill={fill} 
        width={width} 
        height={height} 
        className={className}
        // In some cases, external images might fail even if whitelisted, 
        // but this covers our main API.
      />
    )
  }

  // For arbitrary external URLs, use standard <img> to avoid Optimization DoS risks
  // and Next.js "hostname not configured" errors.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src} 
      alt={alt} 
      className={className} 
      style={fill ? { position: 'absolute', height: '100%', width: '100%', left: 0, top: 0, objectFit: 'contain' } : {}}
      width={width}
      height={height}
    />
  )
}

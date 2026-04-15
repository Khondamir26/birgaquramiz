import { cn } from "@/lib/utils"

interface ProductFrameProps {
  src: string
  alt: string
  loading?: "lazy" | "eager"
  className?: string
}

/**
 * Renders a product image inside the standard BQ frame.
 * Uses a raw <img> so local dev URLs (localhost:5000) and production URLs
 * (media.birga-quramiz.uz) both work without Next.js image proxy config.
 * The frame.svg overlay sits on top to provide the branded border.
 */
export default function ProductFrame({
  src,
  alt,
  loading = "lazy",
  className,
}: ProductFrameProps) {
  if (!src) return (
    <div className={cn("relative bg-white overflow-hidden isolate", className)} />
  )

  return (
    <div className={cn("relative bg-white overflow-hidden isolate", className)}>
      {/* Product image — inset 8% so it sits inside the frame border */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className="absolute inset-[8%] w-[84%] h-[84%] object-contain"
      />

      {/* Frame overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/frame.svg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full z-[2] pointer-events-none select-none"
      />
    </div>
  )
}

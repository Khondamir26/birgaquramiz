import { cn } from "@/lib/utils"

interface ProductFrameProps {
  src: string
  alt: string
  loading?: "lazy" | "eager"
  className?: string
}

/**
 * Renders a product image inside the standard BQ frame.
 *
 * The frameBQ.png has an opaque white interior and a blue border.
 * `mix-blend-mode: multiply` on the frame overlay makes the white interior
 * act as a transparent window (white × product = product), while the blue
 * border stays blue (blue × product ≈ blue).
 *
 * `isolate` on the container keeps the blend self-contained — it won't
 * bleed into the card background or surrounding page elements.
 */
export default function ProductFrame({
  src,
  alt,
  loading = "lazy",
  className,
}: ProductFrameProps) {
  return (
    <div className={cn("relative bg-white overflow-hidden isolate", className)}>
      {/* Product image — inset 8% so it sits inside the frame border */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className="absolute inset-[8%] w-[84%] h-[84%] object-contain"
      />

      {/* Frame overlay — mix-blend-multiply lets the product show through the white interior */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/frame.svg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full z-[2] pointer-events-none select-none"
      />
    </div>
  )
}

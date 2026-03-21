import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  id: string;
  name: string;
  image?: string;
  isHighlight?: boolean;
  onClick?: () => void;
  href?: string;
}

const CategoryCard = memo(function CategoryCard({ name, image, isHighlight, onClick, href }: CategoryCardProps) {
  const className = cn(
    "group relative flex overflow-hidden rounded-2xl active:scale-[0.97] transition-transform duration-150 w-full h-[140px]",
    isHighlight ? "bg-[#163b92]" : "bg-slate-100"
  );

  const Content = (
    <>
      {/* Full-bleed image */}
      {image && (
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      )}

      {/* Dark gradient so text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />

      {/* Title pinned to bottom */}
      <span className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2.5 text-[13px] font-black text-white leading-tight line-clamp-1">
        {name}
      </span>
    </>
  );

  if (href) {
    return <Link href={href} className={className}>{Content}</Link>;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); }
      }}
    >
      {Content}
    </div>
  );
});

export default CategoryCard;

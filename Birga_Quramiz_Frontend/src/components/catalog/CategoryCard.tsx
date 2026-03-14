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
  const containerProps = {
    className: cn(
      "group relative flex flex-col overflow-hidden rounded-[24px] transition-all duration-300 active:scale-[0.97] active:shadow-md text-left w-full h-[180px]",
      isHighlight 
        ? "bg-[#163b92] shadow-[0_8px_30px_rgba(22,59,146,0.15)]" 
        : "bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
    ),
    onClick
  };

  const Content = (
    <>
      {/* Background Image - Absolute fill */}
      {image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 33vw"
            priority={isHighlight}
          />
          {/* Protective Gradient Overlay */}
          <div className={cn(
            "absolute inset-0 z-10",
            isHighlight 
              ? "bg-gradient-to-b from-[#163b92]/80 via-[#163b92]/20 to-black/30" 
              : "bg-gradient-to-b from-white/90 via-white/10 to-transparent"
          )} />
        </div>
      )}

      {/* Title Content */}
      <div className="relative z-20 flex h-full flex-col p-5">
        <h3 className={cn(
          "text-[18px] font-black leading-tight tracking-tight",
          isHighlight ? "text-white" : "text-[#1B4D91]"
        )}>
          {name}
        </h3>
      </div>

      {/* Interactive Overlay */}
      <div className="absolute inset-0 bg-black/[0.04] opacity-0 group-active:opacity-100 transition-opacity pointer-events-none z-30" />
    </>
  );

  if (href) {
    return (
      <Link href={href} {...containerProps}>
        {Content}
      </Link>
    );
  }

  return (
    <div 
      role="button" 
      tabIndex={0} 
      {...containerProps} 
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {Content}
    </div>
  );
});

export default CategoryCard;

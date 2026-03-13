import { MapPin } from "lucide-react";

type NavbarTopBarProps = {
  city: string;
  linksSlot: React.ReactNode;
  rightSlot: React.ReactNode;
};

export default function NavbarTopBar({ city, linksSlot, rightSlot }: NavbarTopBarProps) {
  return (
    <div className="relative border-b border-white/10 bg-[#0c2d80]/20">
      <div className="mx-auto flex h-11 w-full max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-2 text-[13px] font-bold text-white/88">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{city}</span>
        </div>

        {linksSlot}

        <div className="flex items-center gap-3">{rightSlot}</div>
      </div>
    </div>
  );
}

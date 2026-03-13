import Link from "next/link";

import { navbarIconMap } from "@/components/navbar/iconMap";
import type { IconKey } from "@/config/navigation";

export type NavbarLinkItem = {
  id: string;
  href: string;
  label: string;
  iconKey: IconKey;
};

type NavbarLinksProps = {
  links: NavbarLinkItem[];
  pathname: string;
  className?: string;
};

export default function NavbarLinks({ links, pathname, className }: NavbarLinksProps) {
  return (
    <nav className={className}>
      {links.map((link) => {
        const Icon = navbarIconMap[link.iconKey];
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.id}
            href={link.href}
            className={
              isActive
                ? "group flex items-center gap-2 rounded-full bg-white/16 px-3 py-2 text-[13px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-all duration-200"
                : "group flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-bold text-white/82 transition-all duration-200 hover:bg-white/12 hover:text-white"
            }
          >
            <Icon className="size-3.5" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

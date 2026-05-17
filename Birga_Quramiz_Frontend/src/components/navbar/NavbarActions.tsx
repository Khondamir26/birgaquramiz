import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navbarIconMap } from "@/components/navbar/iconMap";
import type { IconKey } from "@/config/navigation";

export type NavbarAction = {
  id: string;
  href: string;
  label: string;
  iconKey: IconKey;
  badge?: number;
};

export type NavbarAccountItem = {
  id: string;
  href: string;
  label: string;
};

type NavbarActionsProps = {
  actions: NavbarAction[];
  pathname: string;
  isAuthenticated: boolean;
  isInitialized: boolean;
  userName?: string;
  accountMenu: NavbarAccountItem[];
  signInLabel: string;
  logoutLabel: string;
  onLogout: () => void;
};

export default function NavbarActions({
  actions,
  pathname,
  isAuthenticated,
  isInitialized,
  userName,
  accountMenu,
  signInLabel,
  logoutLabel,
  onLogout,
}: NavbarActionsProps) {
  const UserIcon = navbarIconMap.user2;

  return (
    <div className="ml-auto -mr-3 flex shrink-0 items-stretch gap-2 lg:gap-4">
      {actions.map((item) => {
        const Icon = navbarIconMap[item.iconKey];
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.id}
            href={item.href}
            className={
              isActive
                ? "group relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 text-center text-white transition-all duration-200"
                : "group relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 text-center text-white/60 transition-all duration-200 hover:text-white"
            }
          >
            <span className="relative flex h-8 items-center justify-center">
              <Icon className="size-5" />
              {!!item.badge && (
                <span className="absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff8a00] px-1 text-[9px] font-black text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
            <span className="text-[13px] font-bold">{item.label}</span>
          </Link>
        );
      })}

      {!isInitialized ? (
        <div className="flex flex-col items-center justify-center gap-1.5 px-3 py-2">
          <div className="h-5 w-5 rounded-full bg-white/25 animate-pulse" />
          <div className="h-2 w-14 rounded bg-white/25 animate-pulse" />
        </div>
      ) : isAuthenticated && userName ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex flex-col items-center justify-center gap-1.5 px-3 py-2 text-center text-white/60 transition-all duration-200 hover:text-white">
              <span className="flex h-8 items-center justify-center">
                <UserIcon className="size-5" />
              </span>
              <span className="max-w-[92px] truncate text-[13px] font-bold">{userName}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/60"
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-[12px] font-black uppercase tracking-wider text-[#1B4D91]">
              {userName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
            {accountMenu.map((item) => (
              <DropdownMenuItem
                key={item.id}
                asChild
                className="cursor-pointer rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700"
              >
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
            <DropdownMenuItem
              variant="destructive"
              onClick={onLogout}
              className="cursor-pointer rounded-xl px-3 py-2 text-[13px] font-semibold"
            >
              {logoutLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link
          href="/login"
          className="group flex flex-col items-center justify-center gap-1.5 px-3 py-2 text-center text-white/60 transition-all duration-200 hover:text-white"
        >
          <span className="flex h-8 items-center justify-center">
            <UserIcon className="size-5" />
          </span>
          <span className="text-[13px] font-bold">{signInLabel}</span>
        </Link>
      )}
    </div>
  );
}

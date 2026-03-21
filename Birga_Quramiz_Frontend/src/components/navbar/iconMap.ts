import {
  ClipboardList,
  Cpu,
  HardHat,
  Heart,
  Home,
  LayoutGrid,
  Package,
  ShoppingCart,
  Tag,
  Truck,
  User2,
  Users,
} from "lucide-react";

import type { IconKey } from "@/config/navigation";

export const navbarIconMap: Record<IconKey, React.ElementType> = {
  home: Home,
  layoutGrid: LayoutGrid,
  hardHat: HardHat,
  truck: Truck,
  cpu: Cpu,
  package: Package,
  users: Users,
  clipboardList: ClipboardList,
  heart: Heart,
  shoppingCart: ShoppingCart,
  user2: User2,
  tag: Tag,
};

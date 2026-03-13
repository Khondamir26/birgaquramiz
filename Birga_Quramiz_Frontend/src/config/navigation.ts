import type { Role } from "@/types";

export type RoleLike = Role | null | undefined;

export type IconKey =
  | "home"
  | "layoutGrid"
  | "hardHat"
  | "truck"
  | "cpu"
  | "package"
  | "users"
  | "clipboardList"
  | "heart"
  | "shoppingCart"
  | "user2";

export type NavLabelKey =
  | "home"
  | "marketplace"
  | "builders"
  | "equipment"
  | "aiConsultant"
  | "adminDashboard"
  | "adminProducts"
  | "users"
  | "orders"
  | "sellerDashboard"
  | "myProducts";

export type ActionLabelKey = "favorites" | "cart" | "orders";

export type AccountLabelKey = "profile" | "myOrders" | "adminDashboard" | "sellerDashboard" | "myProducts" | "orders";

export type NavLink = {
  id: string;
  href: string;
  labelKey: NavLabelKey;
  iconKey: IconKey;
};

export type ActionItem = {
  id: string;
  href: string;
  labelKey: ActionLabelKey;
  iconKey: IconKey;
  badge?: number;
};

export type AccountMenuItem = {
  id: string;
  href: string;
  labelKey: AccountLabelKey;
};

export function getNavLinks(role: RoleLike): NavLink[] {
  if (role === "ADMIN") {
    return [
      { id: "admin-dashboard", href: "/admin", labelKey: "adminDashboard", iconKey: "home" },
      { id: "admin-products", href: "/admin/products", labelKey: "adminProducts", iconKey: "package" },
      { id: "admin-users", href: "/admin/users", labelKey: "users", iconKey: "users" },
      { id: "admin-orders", href: "/admin/orders", labelKey: "orders", iconKey: "clipboardList" },
    ];
  }

  if (role === "SELLER") {
    return [
      { id: "seller-dashboard", href: "/seller/dashboard", labelKey: "sellerDashboard", iconKey: "home" },
      { id: "seller-products", href: "/seller/products", labelKey: "myProducts", iconKey: "package" },
      { id: "seller-orders", href: "/seller/orders", labelKey: "orders", iconKey: "clipboardList" },
      { id: "seller-ai", href: "/ai-chat", labelKey: "aiConsultant", iconKey: "cpu" },
    ];
  }

  return [
    { id: "home", href: "/", labelKey: "home", iconKey: "home" },
    { id: "marketplace", href: "/catalog", labelKey: "marketplace", iconKey: "layoutGrid" },
    { id: "builders", href: "/builders", labelKey: "builders", iconKey: "hardHat" },
    { id: "equipment", href: "/equipment", labelKey: "equipment", iconKey: "truck" },
    { id: "ai", href: "/ai-chat", labelKey: "aiConsultant", iconKey: "cpu" },
  ];
}

export function getActionItems(role: RoleLike, cartCount: number, favCount: number): ActionItem[] {
  const items: ActionItem[] = [];
  const isAdmin = role === "ADMIN";
  const isSeller = role === "SELLER";

  if (!isAdmin && !isSeller) {
    items.push({
      id: "favorites",
      href: "/favorites",
      labelKey: "favorites",
      iconKey: "heart",
      badge: favCount,
    });
  }

  if (role) {
    items.push({
      id: "orders",
      href: role === "ADMIN" ? "/admin/orders" : role === "SELLER" ? "/seller/orders" : "/orders",
      labelKey: "orders",
      iconKey: "clipboardList",
    });
  }

  if (!role || role === "USER") {
    items.push({
      id: "cart",
      href: "/cart",
      labelKey: "cart",
      iconKey: "shoppingCart",
      badge: cartCount,
    });
  }

  return items;
}

export function getAccountMenu(role: RoleLike): AccountMenuItem[] {
  if (role === "ADMIN") {
    return [
      { id: "profile", href: "/profile", labelKey: "profile" },
      { id: "admin", href: "/admin", labelKey: "adminDashboard" },
    ];
  }

  if (role === "SELLER") {
    return [
      { id: "profile", href: "/profile", labelKey: "profile" },
      { id: "seller-dashboard", href: "/seller/dashboard", labelKey: "sellerDashboard" },
      { id: "seller-products", href: "/seller/products", labelKey: "myProducts" },
      { id: "seller-orders", href: "/seller/orders", labelKey: "orders" },
    ];
  }

  return [
    { id: "profile", href: "/profile", labelKey: "profile" },
    { id: "orders", href: "/orders", labelKey: "myOrders" },
  ];
}

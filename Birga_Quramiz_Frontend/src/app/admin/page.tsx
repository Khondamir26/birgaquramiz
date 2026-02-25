"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const cards = [
  { href: "/admin/products", title: "Product Moderation", text: "Approve or reject catalog submissions." },
  { href: "/admin/users", title: "User Control", text: "Review clients, sellers and trust metrics." },
  { href: "/admin/orders", title: "Order Oversight", text: "Track platform-wide order status." },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <section className="surface-card p-6">
        <h1 className="section-title text-primary">Admin Panel</h1>
        <p className="mt-2 text-sm text-muted-foreground">Welcome, {user?.name}. Platform control center for trust, moderation and operations.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="surface-card p-5 hover:border-primary/40">
            <h2 className="text-lg font-bold text-primary">{card.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{card.text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

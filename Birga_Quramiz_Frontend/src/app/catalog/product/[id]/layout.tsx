import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export default async function CatalogProductLayout({ children, params }: LayoutProps) {
  const { id } = await params;

  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Failed to load product");
  }

  const product = await response.json();

  // Permanent redirect to SEO-friendly slug URL
  if (product.slug) {
    redirect(`/product/${product.slug}`);
  }

  return children;
}

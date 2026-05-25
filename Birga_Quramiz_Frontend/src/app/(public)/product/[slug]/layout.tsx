import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ProductSlugLayout({ children }: LayoutProps) {
  return children;
}

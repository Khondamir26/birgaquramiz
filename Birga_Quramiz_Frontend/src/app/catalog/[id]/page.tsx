import { redirect } from "next/navigation";

type LegacyCatalogProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyCatalogProductPage({ params }: LegacyCatalogProductPageProps) {
  const { id } = await params;
  redirect(`/catalog/product/${id}`);
}

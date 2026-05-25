import { notFound } from "next/navigation"
import { getProductBySlug, getProductById } from "@/lib/api/products"
import { resolveImageUrl } from "@/lib/image"
import ProductDetailsPage from "@/components/product/ProductDetailsPage"
import type { Product } from "@/types"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function ProductSlugRoute({ params }: Props) {
  const { slug } = await params

  let product: Product
  try {
    product = await getProductBySlug(slug)
  } catch {
    // slug may actually be a UUID (e.g. from cart or legacy links)
    try {
      product = await getProductById(slug)
    } catch {
      notFound()
    }
  }

  const firstImage =
    product.images && product.images.length > 0
      ? resolveImageUrl(product.images[0])
      : product.imageUrl
        ? resolveImageUrl(product.imageUrl)
        : null

  return (
    <>
      {firstImage && (
        <link rel="preload" as="image" href={firstImage} fetchPriority="high" />
      )}
      <ProductDetailsPage product={product} />
    </>
  )
}

import ProductCard from './ProductCard'
import type { Product } from '@/types'
export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}

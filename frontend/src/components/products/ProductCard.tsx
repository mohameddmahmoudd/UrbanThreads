import Link from 'next/link';
import type { Product } from '@/types/api.types';

export function ProductCard({ product }: { product: Product }) {
  const price = product.variants.length > 0
    ? `From $${Math.min(...product.variants.map((v) => parseFloat(v.price))).toFixed(2)}`
    : `$${parseFloat(product.basePrice).toFixed(2)}`;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-medium text-gray-900 group-hover:text-black">
          {product.name}
        </h3>
        {product.category && (
          <p className="text-xs text-gray-500">{product.category.name}</p>
        )}
        <p className="mt-1 font-semibold">{price}</p>
        {product._count.reviews > 0 && (
          <p className="text-xs text-gray-500">
            {product._count.reviews} review{product._count.reviews !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Link>
  );
}

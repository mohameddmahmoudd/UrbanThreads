import { api } from '@/lib/api';
import type { ProductDetail, PaginatedResponse, Review } from '@/types/api.types';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  let product: ProductDetail;
  try {
    product = await api.get<ProductDetail>(`/products/${id}`);
  } catch {
    notFound();
  }

  const reviews = await api.get<PaginatedResponse<Review>>(
    `/products/${id}/reviews?limit=20`,
  );

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        {product.category && (
          <p className="mt-1 text-sm text-gray-500">{product.category.name}</p>
        )}
        <p className="mt-4 text-2xl font-semibold">
          ${parseFloat(product.basePrice).toFixed(2)}
        </p>

        {product.description && (
          <p className="mt-4 text-gray-700">{product.description}</p>
        )}

        {/* Variants + Add to Cart */}
        <AddToCartButton
          productId={product.id}
          variants={product.variants}
          basePrice={product.basePrice}
        />

        {/* Reviews */}
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">
            Reviews ({product._count.reviews})
          </h2>
          <ReviewForm productId={product.id} />
          <ReviewList reviews={reviews.data} />
        </div>
      </div>
    </div>
  );
}

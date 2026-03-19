import { api } from '@/lib/api';
import type { Product, PaginatedResponse, Category } from '@/types/api.types';
import { ProductCard } from '@/components/products/ProductCard';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ page?: string; categoryId?: string; q?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = params.page || '1';
  const categoryId = params.categoryId || '';
  const q = params.q || '';

  const queryStr = new URLSearchParams({
    page,
    limit: '20',
    ...(categoryId && { categoryId }),
    ...(q && { q }),
  }).toString();

  const [products, categories] = await Promise.all([
    api.get<PaginatedResponse<Product>>(`/products?${queryStr}`),
    api.get<Category[]>('/categories'),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Products</h1>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/"
          className={`rounded-full px-3 py-1 text-sm ${!categoryId ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/?categoryId=${cat.id}`}
            className={`rounded-full px-3 py-1 text-sm ${categoryId === cat.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Products grid */}
      {products.data.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {products.meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: products.meta.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <Link
                key={p}
                href={`/?page=${p}${categoryId ? `&categoryId=${categoryId}` : ''}${q ? `&q=${q}` : ''}`}
                className={`rounded px-3 py-1 text-sm ${p === products.meta.page ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {p}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

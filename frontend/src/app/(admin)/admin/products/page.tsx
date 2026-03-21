'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Product, PaginatedResponse } from '@/types/api.types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null);

  useEffect(() => {
    api.get<PaginatedResponse<Product>>('/admin/products?limit=50').then(setProducts);
  }, []);

  const deactivate = async (id: string) => {
    await api.delete(`/admin/products/${id}`);
    setProducts((prev) =>
      prev ? { ...prev, data: prev.data.map((p: any) => p.id === id ? { ...p, isActive: false } : p) } : null,
    );
  };

  const reactivate = async (id: string) => {
    await api.patch(`/admin/products/${id}/reactivate`, {});
    setProducts((prev) =>
      prev ? { ...prev, data: prev.data.map((p: any) => p.id === id ? { ...p, isActive: true } : p) } : null,
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button size="sm">Add Product</Button>
        </Link>
      </div>

      {!products ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Price</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.data.map((product: any) => (
              <tr key={product.id}>
                <td className="py-3 font-medium">{product.name}</td>
                <td className="py-3">${parseFloat(product.basePrice).toFixed(2)}</td>
                <td className="py-3">{product.category?.name || '—'}</td>
                <td className="py-3">
                  <Badge variant={product.isActive ? 'success' : 'error'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="flex gap-2 py-3">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  {product.isActive ? (
                    <button
                      onClick={() => deactivate(product.id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => reactivate(product.id)}
                      className="text-sm text-green-600 hover:underline"
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

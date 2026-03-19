'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductInput } from '@/lib/validations';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types/api.types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    Promise.all([
      api.get<any>(`/products/${id}`),
      api.get<Category[]>('/categories'),
    ]).then(([product, cats]) => {
      setCategories(cats);
      reset({
        name: product.name,
        description: product.description || '',
        basePrice: parseFloat(product.basePrice),
        categoryId: product.category?.id || '',
      });
      setLoading(false);
    });
  }, [id, reset]);

  const onSubmit = async (data: ProductInput) => {
    setError('');
    try {
      await api.patch(`/admin/products/${id}`, data);
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update product');
    }
  };

  const handleImageUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    await api.upload(`/admin/products/${id}/images`, formData);
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Edit Product</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="name"
          label="Product Name"
          error={errors.name?.message}
          {...register('name')}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <Input
          id="basePrice"
          label="Base Price ($)"
          type="number"
          step="0.01"
          error={errors.basePrice?.message}
          {...register('basePrice', { valueAsNumber: true })}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            {...register('categoryId')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Save Changes
        </Button>
      </form>

      {/* Image upload */}
      <div className="mt-6 rounded-md border p-4">
        <h3 className="mb-2 text-sm font-semibold">Product Image</h3>
        <input ref={fileRef} type="file" accept="image/*" className="text-sm" />
        <Button
          onClick={handleImageUpload}
          size="sm"
          variant="secondary"
          className="mt-2"
        >
          Upload Image
        </Button>
      </div>
    </div>
  );
}

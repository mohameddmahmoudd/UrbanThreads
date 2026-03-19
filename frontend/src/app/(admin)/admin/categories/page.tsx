'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, CategoryInput } from '@/lib/validations';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types/api.types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });

  const loadCategories = async () => {
    const data = await api.get<Category[]>('/categories');
    setCategories(data);
  };

  useEffect(() => {
    loadCategories().catch(() => {});
  }, []);

  const onSubmit = async (data: CategoryInput) => {
    setError('');
    setSuccess('');
    try {
      await api.post('/admin/categories', data);
      setSuccess('Category created successfully.');
      reset({ name: '', parentId: undefined });
      await loadCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create category');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <h1 className="mb-4 text-2xl font-bold">Categories</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-lg border bg-white p-4"
        >
          <Input
            id="name"
            label="Category Name"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-1">
            <label
              htmlFor="parentId"
              className="block text-sm font-medium text-gray-700"
            >
              Parent Category (optional)
            </label>
            <select
              id="parentId"
              {...register('parentId', { setValueAs: (value) => value || undefined })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
            >
              <option value="">No parent</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.parentId?.message && (
              <p className="text-sm text-red-600">{errors.parentId.message}</p>
            )}
          </div>

          <Button type="submit" loading={isSubmitting}>
            Create Category
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Existing Categories</h2>
        <div className="rounded-lg border bg-white">
          {categories.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No categories yet.</p>
          ) : (
            <ul className="divide-y">
              {categories.map((category) => (
                <li key={category.id} className="p-4 text-sm">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-gray-500">
                    products: {category._count.products}
                    {category.parentId ? ` | parent: ${category.parentId}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

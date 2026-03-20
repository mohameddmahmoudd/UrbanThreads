'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema, ReviewInput } from '@/lib/validations';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5 },
  });

  const rating = watch('rating');

  if (!user) return null;
  if (success) {
    return (
      <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
        Review submitted successfully!
      </div>
    );
  }

  const onSubmit = async (data: ReviewInput) => {
    setError('');
    try {
      const formData = new FormData();
      formData.append('rating', data.rating.toString());
      if (data.content) formData.append('content', data.content);
      if (fileRef.current?.files?.[0]) {
        formData.append('image', fileRef.current.files[0]);
      }
      await api.upload(`/products/${productId}/reviews`, formData);
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-6 rounded-md border p-4">
      <h3 className="mb-3 text-sm font-semibold">Write a Review</h3>

      {error && (
        <p className="mb-2 text-sm text-red-600">{error}</p>
      )}

      {/* Star rating */}
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue('rating', star)}
            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        {...register('content')}
        placeholder="Write your review (optional)"
        rows={3}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="mb-3 block text-sm text-gray-500"
      />

      <Button type="submit" size="sm" loading={isSubmitting}>
        Submit Review
      </Button>
    </form>
  );
}

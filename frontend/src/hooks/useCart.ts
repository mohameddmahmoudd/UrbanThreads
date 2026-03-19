'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import type { Cart } from '@/types/api.types';
import { useEffect } from 'react';

export function useCart() {
  const queryClient = useQueryClient();
  const { setItemCount } = useCartStore();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get<Cart>('/cart'),
  });

  useEffect(() => {
    if (cartQuery.data) {
      setItemCount(cartQuery.data.items.length);
    }
  }, [cartQuery.data, setItemCount]);

  const addItem = useMutation({
    mutationFn: (data: { productId: string; variantId?: string; quantity: number }) =>
      api.post('/cart/items', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.patch(`/cart/items/${itemId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/cart/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const holdPoints = useMutation({
    mutationFn: (amount: number) => api.post('/cart/hold-points', { amount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const releasePoints = useMutation({
    mutationFn: () => api.delete('/cart/hold-points'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    addItem,
    updateItem,
    removeItem,
    holdPoints,
    releasePoints,
  };
}

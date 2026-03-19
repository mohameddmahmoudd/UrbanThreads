'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import type { ProductVariant } from '@/types/api.types';

interface Props {
  productId: string;
  variants: ProductVariant[];
  basePrice: string;
}

export function AddToCartButton({ productId, variants, basePrice }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    variants.length > 0 ? variants[0].id : undefined,
  );
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const selectedPrice = selectedVariant
    ? variants.find((v) => v.id === selectedVariant)?.price || basePrice
    : basePrice;

  const handleAdd = () => {
    addItem.mutate({
      productId,
      variantId: selectedVariant,
      quantity,
    });
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Variant selector */}
      {variants.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">Variant</label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  selectedVariant === v.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-gray-400'
                } ${v.stock === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                disabled={v.stock === 0}
              >
                {v.name} — ${parseFloat(v.price).toFixed(2)}
                {v.stock === 0 && ' (Out of stock)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Qty</label>
        <div className="flex items-center rounded-md border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-1 text-lg hover:bg-gray-100"
          >
            -
          </button>
          <span className="px-3 py-1 text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-1 text-lg hover:bg-gray-100"
          >
            +
          </button>
        </div>
        <span className="text-lg font-semibold">
          ${(parseFloat(selectedPrice) * quantity).toFixed(2)}
        </span>
      </div>

      <Button
        onClick={handleAdd}
        loading={addItem.isPending}
        size="lg"
        className="w-full"
      >
        Add to Cart
      </Button>

      {addItem.isSuccess && (
        <p className="text-sm text-green-600">Added to cart!</p>
      )}
    </div>
  );
}

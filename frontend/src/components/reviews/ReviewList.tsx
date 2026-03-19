import type { Review } from '@/types/api.types';

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500">No reviews yet.</p>;
  }

  return (
    <div className="mt-4 space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-md border p-4">
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {review.user.firstName || 'Anonymous'}{' '}
              {review.user.lastName || ''}
            </span>
            {review.isVerifiedPurchase && (
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                Verified
              </span>
            )}
          </div>
          {review.content && (
            <p className="mt-2 text-sm text-gray-700">{review.content}</p>
          )}
          {review.imageUrl && (
            <img
              src={review.imageUrl}
              alt="Review"
              className="mt-2 h-32 w-32 rounded-md object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

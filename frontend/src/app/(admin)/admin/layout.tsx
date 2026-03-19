'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return <p className="py-12 text-center text-gray-500">Access denied.</p>;
  }

  return (
    <div>
      <nav className="mb-6 flex gap-4 border-b pb-3">
        <Link href="/admin/products" className="text-sm font-medium hover:text-black">
          Products
        </Link>
        <Link href="/admin/categories" className="text-sm font-medium hover:text-black">
          Categories
        </Link>
        <Link href="/admin/orders" className="text-sm font-medium hover:text-black">
          Orders
        </Link>
      </nav>
      {children}
    </div>
  );
}

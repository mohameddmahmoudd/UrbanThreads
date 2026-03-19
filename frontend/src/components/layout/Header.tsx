'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user } = useAuthStore();
  const { itemCount } = useCartStore();
  const { logout } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          UrbanThreads
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-700 hover:text-black">
            Products
          </Link>

          {user ? (
            <>
              <Link href="/cart" className="relative text-sm text-gray-700 hover:text-black">
                Cart
                {itemCount > 0 && (
                  <span className="absolute -right-4 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link href="/orders" className="text-sm text-gray-700 hover:text-black">
                Orders
              </Link>
              <Link href="/profile" className="text-sm text-gray-700 hover:text-black">
                Profile
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin/products" className="text-sm text-gray-700 hover:text-black">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-black"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-700 hover:text-black">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

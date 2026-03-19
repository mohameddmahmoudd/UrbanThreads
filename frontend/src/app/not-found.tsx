import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Page not found</p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        Go home
      </Link>
    </div>
  );
}

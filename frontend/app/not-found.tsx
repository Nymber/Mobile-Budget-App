'use client'

import { ErrorBoundary } from '@/components/auth/ErrorBoundary';
import Link from 'next/link';

export default function NotFound() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">404 - Not Found</h1>
        <p className="mb-4">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Home
        </Link>
      </div>
    </ErrorBoundary>
  );
}

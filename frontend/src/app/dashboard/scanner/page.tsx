'use client';

import React from 'react';
import ReceiptScanner from '@/components/dashboard/ReceiptScanner';

export default function ScannerPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8">Receipt Scanner</h1>
      <ReceiptScanner />
    </div>
  );
}

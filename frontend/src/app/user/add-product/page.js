'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProductForm from './ProductForm.js';

export default function AddProducts() {
  return (
    <Suspense fallback={(
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    )}>
      <ProductForm />
    </Suspense>
  );
}

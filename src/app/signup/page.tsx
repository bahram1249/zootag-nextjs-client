'use client';

import { Suspense } from 'react';
import { SignupForm } from './signup-form';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <Suspense
        fallback={
          <div className="w-full max-w-sm">
            <div className="rounded-xl border border-border bg-white p-8 shadow-sm dark:bg-zinc-900 dark:border-zinc-700">
              <div className="flex justify-center py-8">
                <svg className="h-5 w-5 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            </div>
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}

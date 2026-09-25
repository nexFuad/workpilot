'use client';

import { useEffect } from 'react';
import { ErrorView } from '@/components/error/ErrorView';
import './globals.css';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('WorkPilot global error', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <ErrorView message={error.message} />
      </body>
    </html>
  );
}

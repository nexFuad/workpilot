'use client';

import { useEffect } from 'react';
import { ErrorView } from '@/components/error/ErrorView';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('WorkPilot route error', error);
  }, [error]);

  return <ErrorView message={error.message} />;
}

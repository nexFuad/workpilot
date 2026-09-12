import type { Metadata } from 'next';
import { AppProvider } from '@/providers/app-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'WorkPilot',
  description: 'A modern workforce management platform.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

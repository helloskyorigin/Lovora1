import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LOVORA — Love Marriage or Arranged?',
  description: 'A personal Vedic marriage reading. Begin with a free glimpse. Complete reading ₹299 one-time.',
  icons: { icon: '/favicon.svg' },
  openGraph: { title: 'LOVORA — Your Marriage Story', description: 'Your marriage story, written in the stars.', type: 'website' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1b102d' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

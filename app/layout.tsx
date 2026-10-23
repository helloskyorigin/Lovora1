import type { Metadata, Viewport } from 'next';
import './globals.css';
import {headers} from "next/headers";
import {priceForRequest} from "@/lib/pricing";
import {PricingProvider} from "@/components/PricingProvider";

export const metadata: Metadata = {
  title: 'LOVORA — Love Marriage or Arranged?',
  description: 'A personal Vedic marriage reading. Begin with a free glimpse. One-time reading with regional pricing.',
  icons: { icon: '/favicon.svg' },
  openGraph: { title: 'LOVORA — Your Marriage Story', description: 'Your marriage story, written in the stars.', type: 'website' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1b102d' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const quote=priceForRequest(await headers());
  return <html lang="en"><body><PricingProvider quote={quote}>{children}</PricingProvider></body></html>;
}

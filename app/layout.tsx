import type { Metadata, Viewport } from 'next';
import './globals.css';
import {headers} from "next/headers";
import {trustedCountry,hostPlatform} from "@/lib/pricing";
import {regionalQuote} from "@/lib/payments/regional-preview";
import {PricingProvider} from "@/components/PricingProvider";

export const metadata: Metadata = {
  title: 'LOVORA — Love Marriage or Arranged?',
  description: 'A personal Vedic marriage reading. Begin with a free glimpse. One-time reading with regional pricing.',
  icons: { icon: '/favicon.svg' },
  openGraph: { title: 'LOVORA — Your Marriage Story', description: 'Your marriage story, written in the stars.', type: 'website' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1b102d' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const country=trustedCountry(await headers(),hostPlatform());
  const quote=await regionalQuote(country);
  return <html lang="en"><body><PricingProvider quote={quote}>{children}</PricingProvider></body></html>;
}

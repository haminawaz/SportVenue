import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';

import { Providers } from '@/app-shell/Providers';
import { themeBootScript } from '@/theme/appearanceStorage';

import './globals.css';

/** Bricolage Grotesque Light carries headlines and figures (ExtraBold is the logo only). */
const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['300', '800'],
  display: 'swap',
});

/** Instrument Sans carries everything an owner reads or taps. */
const instrument = Instrument_Sans({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SportVenue',
  description: 'Bookings, payments and customers for your sports facility, in one app built for owners.',
  applicationName: 'SportVenue',
};

export const viewport: Viewport = {
  themeColor: '#F3F1EE',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-theme is set before hydration by the boot script, so React must not compare it.
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${bricolage.variable} ${instrument.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

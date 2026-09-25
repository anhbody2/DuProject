import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Lexend } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import Providers from './providers';
import Header from '@/components/Header';
import SearchPanel from '@/components/SearchPanel';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollProgress from '@/components/ScrollProgress';

// Brand display face from the design assets. Its TTF draws glyphs ~2x their
// nominal size (caps reach 2.2em), so scale it to Lexend's proportions, which
// the design's font sizes and line-heights were laid out with.
const display = localFont({
  src: './fonts/NVN-Cocogoose-Vintage.ttf',
  variable: '--font-display',
  display: 'swap',
  declarations: [{ prop: 'size-adjust', value: '50%' }],
});
const body = Lexend({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '700', '800', '900'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: 'Dủ — Cơm phần cho người bận rộn',
  description: 'Đặt cơm phần từ các quán ruột trong xóm.',
  icons: { icon: '/assets/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>
          <Header />
          <SearchPanel />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <ScrollProgress />
        </Providers>
      </body>
    </html>
  );
}

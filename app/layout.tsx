import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NIHON — 수업이 교재가 되는 일본어 과외',
  description: '녹음 한 번이면 교재·복습·정산까지. 선생님은 가르치는 일만.',
  robots: { index: false, follow: false }, // 공개 랜딩(N2) 전까지 noindex 유지
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'NIHON' },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0d', width: 'device-width', initialScale: 1, viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}

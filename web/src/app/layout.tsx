import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GuardianNet',
  description: 'Secure Civic Justice Infrastructure',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-[#0a0a0a] text-[#e5e5e5]">
        {children}
      </body>
    </html>
  );
}

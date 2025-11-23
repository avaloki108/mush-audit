import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Image from 'next/image';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Mush Audit - Smart Contract Security Platform",
  description: "AI-powered smart contract security audit platform",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#1A1A1A] text-white">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-[#2A2A2A]">
            <nav className="max-w-7xl mx-auto px-4 py-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image 
                  src="/mush.png" 
                  alt="Mush Logo" 
                  width={32} 
                  height={32} 
                  priority
                />
                <span className="text-xl font-bold text-[#E5E5E5]">
                  Mush <span className="text-[#FF8B3E]">Audit</span>
                </span>
              </Link>
            </nav>
          </header>
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E1E1E',
              color: '#E5E5E5',
              borderRadius: '8px',
              border: '1px solid #666666',
            },
            error: {
              style: {
                background: '#1E1E1E',
                color: '#E5E5E5',
                border: '1px solid #666666',
              },
              iconTheme: {
                primary: '#F48771',
                secondary: '#1E1E1E',
              },
              duration: 4000,
            },
            success: {
              style: {
                background: '#1E1E1E',
                color: '#E5E5E5',
                border: '1px solid #666666',
              },
              iconTheme: {
                primary: '#89D185',
                secondary: '#1E1E1E',
              },
              duration: 4000,
            },
          }}
        />
      </body>
    </html>
  );
}

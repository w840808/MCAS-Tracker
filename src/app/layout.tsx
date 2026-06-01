import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '狐狸的專屬日記 | MCAS Tracker',
  description: 'Zero-friction MCAS symptom tracking and analysis.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning>
        <div className="flex justify-center h-[100dvh] w-screen bg-black sm:py-4">
          <div className="relative w-full h-full max-w-md bg-[#0f172a] sm:rounded-[2rem] sm:border-[6px] sm:border-gray-800 overflow-hidden shadow-2xl flex flex-col">
            {/* The main scrollable content area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[120px]">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'UTSAV VENUES | Banquet Halls & Event Venue Booking Platform',
  description: 'Book verified banquet halls, marriage palaces, and luxury event venues across Bangalore, Mumbai, Delhi NCR, Hyderabad, and Chennai.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fdfbf7] text-stone-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

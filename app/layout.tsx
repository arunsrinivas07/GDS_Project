import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "DOP Study Academi — GDS Exam Preparation | India Post",
  description: "India's #1 GDS Exam preparation platform. Comprehensive study material, mock tests, and performance tracking for Gramin Dak Sevak recruitment by India Post.",
  icons: {
    icon: "/logo.png",
  },
};

import { AuthProvider } from "@/lib/authContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased bg-warm" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

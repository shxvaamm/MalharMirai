import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MALHAR – The Cultural Society of Mirai",
  description:
    "Malhar is the cultural society of Mirai School of Technology, started by the 2025–29 batch. From dance and singing to management and tech, we give students the stage to build skills and showcase their talent.",
  keywords: [
    "MALHAR",
    "Mirai School of Technology",
    "Cultural Society",
    "Mirai",
    "College Fest",
    "Media",
    "Design",
    "Management",
    "Technical Department",
    "PR Department",
  ],
  icons: {
    icon: "/images/malhar-logo.png",
  },
  other: {
    // Preload critical above-the-fold static assets to eliminate render-blocking logo flicker
    "preload-wordmark": "/images/malhar-wordmark.png",
    "preload-mirai": "/images/mirai-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Preload critical above-the-fold static images — eliminates logo render flash */}
        <link rel="preload" href="/images/malhar-wordmark.png" as="image" type="image/png" />
        <link rel="preload" href="/images/mirai-logo.png" as="image" type="image/png" />
        <link rel="preload" href="/images/malhar-logo.png" as="image" type="image/png" />
        {/* DNS prefetch for Supabase storage to accelerate remote image loading */}
        <link rel="dns-prefetch" href="https://supabase.co" />
        <link rel="preconnect" href="https://supabase.co" crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans min-h-screen bg-black text-neutral-100 flex flex-col antialiased selection:bg-white selection:text-black tracking-tight`}
      >
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}





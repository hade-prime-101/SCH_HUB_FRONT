import type { Metadata, Viewport } from "next";
import '@/app/ui/globals.css';
import { geist } from '@/app/ui/fonts';
import { ThemeProvider } from '@/app/ui/theme-provider';

export const metadata: Metadata = {
  title: "LOOPZ",
  description: "Your campus companion — study, connect, and thrive.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg",       type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LOOPZ",
  },
};

// themeColor must live in viewport export (Next.js 14+)
export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

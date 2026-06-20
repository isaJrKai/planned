import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planned — Family Savings & Allowance",
  description:
    "A quiet, editorial wealth-building canvas for families. Track savings, investments, tokens, and spending with the calm of a private bank.",
  keywords: [
    "family savings",
    "allowance",
    "kids finance",
    "token economy",
    "investment tracker",
  ],
  authors: [{ name: "Planned" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <head>
        {/* Set theme before paint to avoid FOUC. Reads from localStorage if set. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('planned-theme');if(t&&['dark','light','pink','red'].includes(t)){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        {/* Ultra-fine noise grain for organic warmth */}
        <div className="grain-overlay" aria-hidden />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const fontKey = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-key",
});

const fontUi = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "OUSIDECK",
  description:
    "Control OBS from everywhere with your OUSIDECK, which is similar to Stream Deck but with more features and more customizable",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontKey.variable} ${fontUi.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

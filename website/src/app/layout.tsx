import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ask My Lawyer",
    template: "%s | Ask My Lawyer",
  },
  description:
    "Ask My Lawyer",
};

/**
 * Only the document shell. The header and footer live in each page, because
 * the customer and lawyer pages carry different menus.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

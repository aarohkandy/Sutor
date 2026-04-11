import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Sutor",
  description: "Practice. Analyze. Improve."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${ebGaramond.variable} editorial-shell`}>
        {children}
      </body>
    </html>
  );
}

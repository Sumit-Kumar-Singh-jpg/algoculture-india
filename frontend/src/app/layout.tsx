import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseTrade India — Intraday, F&O & Long-Term Terminal",
  description:
    "Live NSE/BSE charts, AI prediction forecasts, and Moneycontrol-powered stock news.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

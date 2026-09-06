import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TicketDesk AI",
  description: "AI-powered support ticket management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
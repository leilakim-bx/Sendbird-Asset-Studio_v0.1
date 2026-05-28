import type { Metadata } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/layout/LayoutShell";

export const metadata: Metadata = {
  title: "Sendbird Asset Studio",
  description: "Generate product marketing images based on Sendbird design system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full flex bg-studio-bg text-studio-text">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}

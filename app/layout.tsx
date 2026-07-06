import type { Metadata } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { appTokenCssVariables } from "@/lib/tokens/app";

export const metadata: Metadata = {
  title: "Delight.ai Asset Studio",
  description: "Generate product marketing images based on Delight.ai design system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <style dangerouslySetInnerHTML={{ __html: appTokenCssVariables() }} />
      </head>
      <body className="h-full flex bg-studio-bg text-studio-text">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}

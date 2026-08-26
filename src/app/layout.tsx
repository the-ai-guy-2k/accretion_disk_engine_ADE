import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { FOUNDATION_STAGE, PRODUCT_NAME, PRODUCT_SHORT } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} (${PRODUCT_SHORT})`,
  description: FOUNDATION_STAGE
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

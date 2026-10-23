import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Orbit — Product workspace",
  description: "A little space for your next big thing.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

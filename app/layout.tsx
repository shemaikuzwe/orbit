import type { Metadata } from "next";
import { headers } from "next/headers";
import { SessionProvider } from "@/components/session-provider";
import { auth } from "@/lib/auth";
import "./globals.css";
export const metadata: Metadata = {
  title: "Orbit — Product workspace",
  description: "A little space for your next big thing.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}

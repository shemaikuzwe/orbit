import type { Metadata } from "next";
import { headers } from "next/headers";
import { ThemeProvider } from "next-themes";
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <SessionProvider session={session}>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

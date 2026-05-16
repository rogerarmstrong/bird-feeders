import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bird Feeder Monitor",
  description: "Monitor bird feeder visits, feed levels, device health, and alerts."
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/feeders", label: "Feeders" },
  { href: "/users", label: "Users" },
  { href: "/alerts", label: "Alerts" },
  { href: "/reports", label: "Reports" }
];

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-skywash via-[#f7f4ea] to-[#edf5df]">
        <header className="sticky top-0 z-10 border-b border-canopy/10 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-canopy text-lg font-black text-white">
                BF
              </span>
              <div>
                <p className="text-lg font-bold text-canopy">Bird Feeder Monitor</p>
                <p className="text-sm text-canopy/65">Live visits, feed levels, and device health</p>
              </div>
            </Link>
            {session?.user ? (
              <nav className="flex rounded-full bg-canopy/5 p-1 text-sm font-medium text-canopy">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 transition hover:bg-white hover:shadow-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}
            <div className="flex items-center gap-3">
              {session?.user ? (
                <>
                  <span className="hidden max-w-[12rem] truncate text-sm font-medium text-canopy/70 sm:inline">
                    {session.user.email}
                  </span>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="rounded-full bg-canopy px-4 py-2 text-sm font-bold text-white transition hover:bg-moss"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}

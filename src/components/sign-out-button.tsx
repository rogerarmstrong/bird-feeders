"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
      className="rounded-full bg-canopy px-4 py-2 text-sm font-bold text-white transition hover:bg-moss"
    >
      Sign out
    </button>
  );
}

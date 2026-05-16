"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type SignInFormProps = {
  providers: {
    google: boolean;
    apple: boolean;
  };
};

export function SignInForm({ providers }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl,
      redirect: false
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("We could not sign you in with those credentials.");
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-canopy/10 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-moss">Welcome back</p>
        <h1 className="mt-2 text-3xl font-black text-canopy">Sign in</h1>
        <p className="mt-3 text-sm text-canopy/65">Use your bird feeder monitoring account.</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold text-canopy">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue="demo@birdfeeders.local"
            className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
        <label className="block text-sm font-bold text-canopy">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            defaultValue="birdwatcher123"
            className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>

        {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-canopy px-4 py-3 font-bold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-canopy/40">
        <span className="h-px flex-1 bg-canopy/10" />
        or
        <span className="h-px flex-1 bg-canopy/10" />
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          disabled={!providers.google}
          onClick={() => signIn("google", { callbackUrl })}
          className="rounded-2xl border border-canopy/15 px-4 py-3 font-bold text-canopy transition hover:bg-canopy/5 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Continue with Google
        </button>
        <button
          type="button"
          disabled={!providers.apple}
          onClick={() => signIn("apple", { callbackUrl })}
          className="rounded-2xl border border-canopy/15 px-4 py-3 font-bold text-canopy transition hover:bg-canopy/5 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Continue with Apple
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-canopy/65">
        Need an account?{" "}
        <Link href="/auth/register" className="font-bold text-moss hover:text-canopy">
          Create one
        </Link>
      </p>
    </div>
  );
}

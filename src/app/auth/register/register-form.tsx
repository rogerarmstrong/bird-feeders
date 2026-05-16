"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email,
        password
      })
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "We could not create that account.");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
      redirect: false
    });

    setIsSubmitting(false);

    if (result?.error) {
      router.push("/auth/sign-in");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-canopy/10 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-moss">Get started</p>
        <h1 className="mt-2 text-3xl font-black text-canopy">Create account</h1>
        <p className="mt-3 text-sm text-canopy/65">Set up access to the feeder monitoring dashboard.</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold text-canopy">
          Name
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
        <label className="block text-sm font-bold text-canopy">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
        <label className="block text-sm font-bold text-canopy">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>

        {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-canopy px-4 py-3 font-bold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-canopy/65">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-bold text-moss hover:text-canopy">
          Sign in
        </Link>
      </p>
    </div>
  );
}

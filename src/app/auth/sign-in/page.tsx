import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { SignInForm } from "@/app/auth/sign-in/sign-in-form";
import { authOptions, authProviderAvailability } from "@/lib/auth";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
      <SignInForm providers={authProviderAvailability} />
    </div>
  );
}

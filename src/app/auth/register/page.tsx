import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { RegisterForm } from "@/app/auth/register/register-form";
import { authOptions } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
      <RegisterForm />
    </div>
  );
}

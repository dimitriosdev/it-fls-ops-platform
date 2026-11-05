import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth/authorization";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div>
        <h1>Login</h1>
        <LoginForm />
      </div>
    </main>
  );
}

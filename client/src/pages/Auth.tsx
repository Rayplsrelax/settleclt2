import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

async function postJson(path: string, body: Record<string, string>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as { message?: string; returnTo?: string };
}

export default function Auth() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/";
  const resetToken = new URLSearchParams(window.location.search).get("resetToken") || "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      if (mode === "forgot") {
        const result = await postJson("/api/auth/forgot-password", { email });
        setMessage(result.message || "If an account exists, a reset email has been sent.");
        return;
      }
      if (resetToken) {
        await postJson("/api/auth/reset-password", { token: resetToken, password });
        setMessage("Password updated. You can now sign in.");
        navigate("/auth");
        return;
      }
      const result = mode === "login"
        ? await postJson("/api/auth/login", { email, password, returnTo })
        : await postJson("/api/auth/register", { email, name, password });
      if (mode === "login") {
        navigate(result.returnTo || returnTo);
      } else {
        setMessage(result.message || "Check your email to verify your account.");
        setMode("login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  const title = mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset your password";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-center">{title}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Sign in securely to Settle CLT.</p>
        {message && <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {mode !== "forgot" && (
          <a className="mt-6 block" href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}>
            <Button type="button" variant="outline" className="w-full">Continue with Google</Button>
          </a>
        )}
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && <label className="block text-sm">Name<input required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" /></label>}
          <label className="block text-sm">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" /></label>
          {mode !== "forgot" && <label className="block text-sm">Password<input required type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={12} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" /></label>}
          <Button type="submit" className="w-full">{mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset email"}</Button>
        </form>
        <div className="mt-6 space-y-2 text-center text-sm">
          {mode === "login" && <><button className="text-primary underline" onClick={() => setMode("forgot")}>Forgot password?</button><br /><button className="text-primary underline" onClick={() => setMode("register")}>Create an account</button></>}
          {mode !== "login" && <button className="text-primary underline" onClick={() => setMode("login")}>Back to sign in</button>}
        </div>
      </section>
    </main>
  );
}

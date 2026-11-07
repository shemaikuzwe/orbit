"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function enterWorkspace() {
    const organizations = await authClient.organization.list();
    if (organizations.error) throw new Error(organizations.error.message);
    const organization = organizations.data?.[0];
    if (organization) {
      const active = await authClient.organization.setActive({
        organizationId: organization.id,
      });
      if (active.error) throw new Error(active.error.message);
    }
    router.replace("/");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      {
        const credentials = {
          email: String(form.get("email")),
          password: String(form.get("password")),
        };
        const result =
          mode === "sign-up"
            ? await authClient.signUp.email({
                ...credentials,
                name: String(form.get("name")).trim(),
              })
            : await authClient.signIn.email(credentials);
        if (result.error) throw new Error(result.error.message);
      }
      await enterWorkspace();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to continue. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Orbit workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "sign-up" ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground">
            A calmer place to move work forward.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={pending} className="space-y-4">
            <>
              {mode === "sign-up" && (
                <label className="block space-y-2 text-sm">
                  Name
                  <Input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                  />
                </label>
              )}
              <label className="block space-y-2 text-sm">
                Email
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="block space-y-2 text-sm">
                Password
                <Input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "sign-up" ? "new-password" : "current-password"
                  }
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
            </>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {pending
                ? "Please wait…"
                : mode === "sign-up"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </fieldset>
        </form>
        <Button
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError("");
          }}
        >
          {mode === "sign-in"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </Button>
      </section>
    </main>
  );
}

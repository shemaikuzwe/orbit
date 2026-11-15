"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.2z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [pending, setPending] = useState<"" | "email" | "google">("");
  const [error, setError] = useState("");
  const signUp = mode === "sign-up";

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

  async function attempt(
    kind: "email" | "google",
    action: () => Promise<void>,
  ) {
    setPending(kind);
    setError("");
    try {
      await action();
    } catch (error) {
      // Some auth failures (e.g. an unconfigured provider) carry no message.
      setError(
        (error instanceof Error && error.message) ||
          "Unable to continue. Please try again.",
      );
      setPending("");
    }
  }

  function google() {
    // Redirects to Google; the workspace gate picks the team on return.
    void attempt("google", async () => {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (result.error) throw new Error(result.error.message);
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void attempt("email", async () => {
      const credentials = {
        email: String(form.get("email")),
        password: String(form.get("password")),
      };
      const result = signUp
        ? await authClient.signUp.email({
            ...credentials,
            name: String(form.get("name")).trim(),
          })
        : await authClient.signIn.email(credentials);
      if (result.error) throw new Error(result.error.message);
      await enterWorkspace();
      setPending("");
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-sidebar px-4 py-10">
      <section className="w-full max-w-[380px] rounded-xl border bg-card p-7 shadow-[0_1px_3px_#0000000d]">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-base text-primary-foreground">
          ◒
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-[-0.3px]">
          {signUp ? "Create your account" : "Sign in to Orbit"}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {signUp
            ? "Start tracking work with your team."
            : "Welcome back. Pick up where you left off."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6 h-9 w-full text-[13px] font-medium"
          disabled={!!pending}
          onClick={google}
        >
          {pending === "google" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <GoogleIcon />
          )}
          {signUp ? "Sign up with Google" : "Continue with Google"}
        </Button>
        <div className="my-5 flex items-center gap-3 text-xs text-faint-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          or
        </div>
        <form onSubmit={submit}>
          <fieldset disabled={!!pending} className="space-y-4">
            {signUp && (
              <label className="block space-y-1.5 text-[13px] font-medium">
                Name
                <Input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="h-9"
                />
              </label>
            )}
            <label className="block space-y-1.5 text-[13px] font-medium">
              Email
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-9"
              />
            </label>
            <label className="block space-y-1.5 text-[13px] font-medium">
              Password
              <Input
                name="password"
                type="password"
                autoComplete={signUp ? "new-password" : "current-password"}
                minLength={8}
                maxLength={128}
                required
                aria-describedby={signUp ? "password-hint" : undefined}
                className="h-9"
              />
              {signUp && (
                <span
                  id="password-hint"
                  className="block text-xs font-normal text-muted-foreground"
                >
                  At least 8 characters
                </span>
              )}
            </label>
            {error && (
              <p role="alert" className="text-[13px] text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="h-9 w-full text-[13px]"
              disabled={!!pending}
            >
              {pending === "email" && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {signUp ? "Create account" : "Sign in"}
            </Button>
          </fieldset>
        </form>
        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          {signUp ? "Already have an account?" : "New to Orbit?"}{" "}
          <button
            type="button"
            className="font-medium text-accent-foreground hover:underline"
            disabled={!!pending}
            onClick={() => {
              setMode(signUp ? "sign-in" : "sign-up");
              setError("");
            }}
          >
            {signUp ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}

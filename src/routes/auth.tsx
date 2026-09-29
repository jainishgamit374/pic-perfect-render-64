import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
} from "@/design-system/gentle-code-library-71de11";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Inspect" },
      { name: "description", content: "Sign in to your Inspect account to manage property inspections and reports." },
      { property: "og:title", content: "Sign in — Inspect" },
      { property: "og:description", content: "Access your property inspections, photo sets and generated reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (signUpError) throw signUpError;
        if (!data.session) setNotice("Check your inbox to confirm your email address.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in did not complete.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="app-center-screen">
      <Card className="app-auth-card">
        <div className="app-stack">
          <div>
            <h1 className="ds-h1">{mode === "signin" ? "Sign in to Inspect" : "Create your account"}</h1>
            <p className="ds-body">Property inspections, graded photos and reports in one place.</p>
          </div>

          {error && <Alert tone="error" title="Could not continue">{error}</Alert>}
          {notice && <Alert tone="info" title="Almost there">{notice}</Alert>}

          <form className="app-stack" onSubmit={submit}>
            <Field label="Work email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="password" hint="At least 6 characters">
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" size="lg" loading={busy}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <Button variant="secondary" size="lg" onClick={google}>
            Continue with Google
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "../../lib/supabase";

type Mode = "login" | "signup" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setMessage("Check your email for a login link.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm your account.");
        setLoading(false);
        return;
      }

      // login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #0e0e10)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--surface, #1a1a2e)",
          border: "1px solid var(--border, #2a2a3e)",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text, #e0e0e0)",
            marginBottom: 4,
            textAlign: "center",
          }}
        >
          Chief Scout
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--text2, #888)",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {mode === "login" && "Sign in to your account"}
          {mode === "signup" && "Create a new account"}
          {mode === "magic" && "Sign in with a magic link"}
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text2, #888)",
              marginBottom: 4,
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              background: "var(--bg, #0e0e10)",
              border: "1px solid var(--border, #2a2a3e)",
              borderRadius: 8,
              color: "var(--text, #e0e0e0)",
              marginBottom: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
            placeholder="you@example.com"
          />

          {mode !== "magic" && (
            <>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text2, #888)",
                  marginBottom: 4,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 14,
                  background: "var(--bg, #0e0e10)",
                  border: "1px solid var(--border, #2a2a3e)",
                  borderRadius: 8,
                  color: "var(--text, #e0e0e0)",
                  marginBottom: 12,
                  boxSizing: "border-box",
                  outline: "none",
                }}
                placeholder="Min 6 characters"
              />
            </>
          )}

          {error && (
            <p
              style={{
                fontSize: 13,
                color: "#ef4444",
                marginBottom: 12,
                padding: "8px 10px",
                background: "rgba(239,68,68,0.1)",
                borderRadius: 6,
              }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              style={{
                fontSize: 13,
                color: "var(--accent, #6c63ff)",
                marginBottom: 12,
                padding: "8px 10px",
                background: "rgba(108,99,255,0.1)",
                borderRadius: 6,
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 0",
              fontSize: 14,
              fontWeight: 600,
              background: "var(--accent, #6c63ff)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              marginBottom: 16,
            }}
          >
            {loading
              ? "..."
              : mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Sign Up"
              : "Send Magic Link"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
          }}
        >
          {mode === "login" && (
            <>
              <button
                onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
                style={linkStyle}
              >
                Don&apos;t have an account? Sign up
              </button>
              <button
                onClick={() => { setMode("magic"); setError(null); setMessage(null); }}
                style={linkStyle}
              >
                Sign in with magic link
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              onClick={() => { setMode("login"); setError(null); setMessage(null); }}
              style={linkStyle}
            >
              Already have an account? Sign in
            </button>
          )}
          {mode === "magic" && (
            <button
              onClick={() => { setMode("login"); setError(null); setMessage(null); }}
              style={linkStyle}
            >
              Sign in with password instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--accent, #6c63ff)",
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

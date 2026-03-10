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

      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      padding: 20,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: "var(--surface)",
        border: "1px solid var(--accent)",
        borderRadius: 2,
        padding: "36px 32px 32px",
        boxShadow: "0 0 30px rgba(0,240,255,0.15), inset 0 0 30px rgba(0,240,255,0.03)",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 6,
            fontFamily: "var(--font-mono), monospace",
          }}>
            Scouting Intelligence
          </div>
          <h1 style={{
            fontSize: "1.4rem",
            fontWeight: 900,
            color: "var(--accent)",
            letterSpacing: "0.06em",
            margin: 0,
            fontFamily: "var(--font-orbitron), monospace",
            textShadow: "0 0 20px rgba(0,240,255,0.5), 0 0 40px rgba(0,240,255,0.2)",
          }}>
            CHIEF SCOUT
          </h1>
          <div style={{
            width: 40,
            height: 1,
            background: "var(--accent)",
            margin: "10px auto 0",
            boxShadow: "0 0 8px var(--accent)",
          }} />
        </div>

        {/* Mode subtitle */}
        <p style={{
          fontSize: "0.72rem",
          color: "var(--text2)",
          textAlign: "center",
          marginBottom: 20,
          fontFamily: "var(--font-mono), monospace",
          letterSpacing: "0.04em",
        }}>
          {mode === "login" && "> sign_in --account"}
          {mode === "signup" && "> create --new-account"}
          {mode === "magic" && "> auth --magic-link"}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{
            display: "block",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text3)",
            marginBottom: 5,
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "9px 12px",
              fontSize: "0.85rem",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              color: "var(--text)",
              marginBottom: 14,
              boxSizing: "border-box",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(0,240,255,0.2)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
          />

          {mode !== "magic" && (
            <>
              <label style={{
                display: "block",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text3)",
                marginBottom: 5,
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min 6 characters"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "0.85rem",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  color: "var(--text)",
                  marginBottom: 14,
                  boxSizing: "border-box",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
            </>
          )}

          {error && (
            <div style={{
              fontSize: "0.78rem",
              color: "var(--amber)",
              marginBottom: 14,
              padding: "8px 10px",
              background: "var(--amber-dim)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 2,
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              fontSize: "0.78rem",
              color: "var(--green)",
              marginBottom: 14,
              padding: "8px 10px",
              background: "var(--green-dim)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 2,
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 42,
              fontSize: "0.8rem",
              fontWeight: 700,
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              borderRadius: 2,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              marginBottom: 16,
              transition: "all 0.15s",
              fontFamily: "var(--font-orbitron), monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              boxShadow: "0 0 15px rgba(0,240,255,0.2)",
            }}
          >
            {loading
              ? ">>>"
              : mode === "login"
              ? "[ ENTER ]"
              : mode === "signup"
              ? "[ CREATE ]"
              : "[ SEND LINK ]"}
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
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
  color: "var(--text3)",
  fontSize: "0.75rem",
  cursor: "pointer",
  padding: 0,
  fontFamily: "inherit",
  transition: "color 0.15s",
};

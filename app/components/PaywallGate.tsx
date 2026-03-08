"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Tier } from "@/lib/stripe";

interface PaywallGateProps {
  requiredTier: "scout" | "pro";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const TIER_RANK: Record<Tier, number> = { free: 0, scout: 1, pro: 2 };

export default function PaywallGate({
  requiredTier,
  children,
  fallback,
}: PaywallGateProps) {
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTier() {
      try {
        const res = await fetch("/api/user/tier");
        const data = await res.json();
        setTier(data.tier || "free");
      } catch {
        setTier("free");
      } finally {
        setLoading(false);
      }
    }
    fetchTier();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          color: "var(--text3)",
          fontSize: "0.85rem",
        }}
      >
        Loading...
      </div>
    );
  }

  const hasAccess =
    tier !== null && TIER_RANK[tier] >= TIER_RANK[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      style={{
        padding: 32,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          color: "var(--text2)",
          lineHeight: 1.5,
        }}
      >
        Upgrade to{" "}
        <span
          style={{
            fontWeight: 700,
            color: "var(--accent)",
            textTransform: "capitalize",
          }}
        >
          {requiredTier}
        </span>{" "}
        to unlock this feature.
      </div>
      <Link
        href="/pricing"
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "8px 20px",
          borderRadius: 8,
          background: "var(--accent)",
          color: "white",
          fontWeight: 600,
          fontSize: "0.85rem",
          textDecoration: "none",
          transition: "opacity 0.15s",
        }}
      >
        View Plans
      </Link>
    </div>
  );
}

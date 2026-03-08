"use client";

import { useCallback, useEffect, useState } from "react";

interface NewsResponse {
  player_id: number;
  player_name: string | null;
  news: string | null;
  reason?: string;
  generated_at?: string;
}

export default function PlayerNews({ playerId }: { playerId: number }) {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}/news`);
      const json: NewsResponse = await res.json();
      setData(json);
    } catch {
      setData({ player_id: playerId, player_name: null, news: null, reason: "Network error" });
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Player News</span>
        </div>
        <div style={styles.skeletonLine} />
        <div style={{ ...styles.skeletonLine, width: "85%" }} />
        <div style={{ ...styles.skeletonLine, width: "70%" }} />
        <div style={{ ...styles.skeletonLine, width: "90%" }} />
      </div>
    );
  }

  /* ── No news ── */
  if (!data?.news) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Player News</span>
          <button style={styles.refreshBtn} onClick={fetchNews}>
            Refresh
          </button>
        </div>
        <p style={styles.unavailable}>News unavailable</p>
      </div>
    );
  }

  /* ── Render bullets ── */
  const lines = data.news
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Player News</span>
        <button style={styles.refreshBtn} onClick={fetchNews}>
          Refresh
        </button>
      </div>

      <ul style={styles.list}>
        {lines.map((line, i) => (
          <li key={i} style={styles.bullet}>
            {line.replace(/^[-*•]\s*/, "")}
          </li>
        ))}
      </ul>

      {data.generated_at && (
        <p style={styles.timestamp}>
          Updated {new Date(data.generated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}

/* ── Inline styles using CSS variables from the app's dark theme ── */

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  refreshBtn: {
    background: "var(--surface2)",
    color: "var(--accent)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 500,
  },
  list: {
    margin: 0,
    paddingLeft: 16,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  bullet: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "var(--text2)",
  },
  unavailable: {
    fontSize: 12,
    color: "var(--text3)",
    margin: 0,
    fontStyle: "italic",
  },
  timestamp: {
    fontSize: 10,
    color: "var(--text3)",
    margin: 0,
    textAlign: "right",
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
    background: "var(--surface2)",
    width: "100%",
    animation: "pulse 1.5s ease-in-out infinite",
  },
};

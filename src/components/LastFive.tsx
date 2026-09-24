const STYLES: Record<"W" | "D" | "L", string> = {
  W: "var(--win)",
  D: "var(--draw)",
  L: "var(--loss)",
};

export default function LastFive({ results }: { results: ("W" | "D" | "L")[] }) {
  if (results.length === 0) {
    return <span className="text-xs text-[var(--muted)]">—</span>;
  }

  return (
    <div className="flex gap-1">
      {results.map((r, i) => (
        <span
          key={i}
          title={r === "W" ? "Win" : r === "D" ? "Draw" : "Loss"}
          className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          style={{ background: STYLES[r] }}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

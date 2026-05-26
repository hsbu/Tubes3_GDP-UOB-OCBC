import type { MatchResult } from '../../shared/types';

interface Props {
  results: MatchResult[];
}

export function KeywordChart({ results }: Props) {
  const counts = new Map<string, number>();
  for (const r of results) {
    counts.set(r.keyword, (counts.get(r.keyword) ?? 0) + r.count);
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (sorted.length === 0) return null;

  const max = sorted[0][1];

  return (
    <div class="chart-section">
      <h3>Top Keywords</h3>
      {sorted.map(([kw, count]) => (
        <div class="chart-row" key={kw}>
          <span class="chart-label" title={kw}>{kw}</span>
          <div class="chart-bar-bg">
            <div
              class="chart-bar-fill"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span class="chart-count">{count}</span>
        </div>
      ))}
    </div>
  );
}

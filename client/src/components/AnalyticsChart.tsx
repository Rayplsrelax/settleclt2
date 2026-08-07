interface DailyDataPoint {
  date: string;
  views: number;
  clicks: number;
  leads: number;
}

interface AnalyticsChartProps {
  data: DailyDataPoint[];
  metric: "views" | "clicks" | "leads";
  color?: string;
  height?: number;
}

export function AnalyticsChart({
  data,
  metric,
  color = "#0d9488",
  height = 120,
}: AnalyticsChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No data yet — analytics populate after the first daily snapshot.
      </div>
    );
  }

  const values = data.map((d) => d[metric]);
  const maxVal = Math.max(...values, 1);
  const barWidth = 100 / data.length;
  const barGap = barWidth * 0.15;
  const actualBarWidth = barWidth - barGap;

  return (
    <div className="w-full">
      <div className="flex items-end gap-px" style={{ height }}>
        {data.map((d, i) => {
          const val = d[metric];
          const barHeight = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const dateLabel = new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end group relative"
              style={{ minWidth: "8px" }}
            >
              {/* Tooltip */}
              <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                {dateLabel}: {val}
              </div>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: val > 0 ? "3px" : "0",
                }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export function Sparkline({
  data,
  color = "#2dd4bf",
}: {
  data: { date: string; value: number }[];
  color?: string;
}) {
  return (
    <div className="h-10 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.6}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

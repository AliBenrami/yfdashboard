"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  ComposedChart,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

type ChartType = "line" | "area" | "bar";

interface ChartData {
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

export default function RechartsStock({
  data,
  height = 400,
  type = "line",
  showVolume = true,
}: {
  data: ChartData[];
  height?: number;
  type?: ChartType;
  showVolume?: boolean;
}) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        date: new Date(d.date).toLocaleDateString(),
        rawDate: d.date,
        price: d.price,
        volume: d.volume,
      })),
    [data]
  );

  const dateSpanDays = useMemo(() => {
    if (data.length < 2) return 0;
    const first = new Date(data[0].date).getTime();
    const last = new Date(data[data.length - 1].date).getTime();
    return Math.max(0, Math.round((last - first) / (1000 * 60 * 60 * 24)));
  }, [data]);

  const renderTooltip = (props: any) => {
    const { active, payload } = props || {};
    if (!active || !payload || !payload.length) return null;

    const p = payload[0];
    const price = typeof p.value === "number" ? p.value : Number(p.value);
    const rawDate = p?.payload?.rawDate as string | undefined;
    const vol = p?.payload?.volume as number | undefined;
    const dateLabel = (() => {
      const d = rawDate ? new Date(rawDate) : null;
      if (!d) return payload[0].payload?.date ?? "";
      if (dateSpanDays <= 31) {
        return d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      } else if (dateSpanDays <= 366) {
        return d.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        });
      } else {
        return d.toLocaleDateString(undefined, { year: "numeric" });
      }
    })();

    return (
      <div className="backdrop-blur-md bg-white/70 dark:bg-black/50 border border-black/5 shadow-sm px-3 py-2 rounded-md text-[11px]">
        <div className="text-gray-700 dark:text-gray-200">{dateLabel}</div>
        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          ${price.toFixed(2)}
        </div>
        {typeof vol === "number" && (
          <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
            V {(vol / 1_000_000).toFixed(1)}M
          </div>
        )}
      </div>
    );
  };

  const grid = <CartesianGrid strokeDasharray="3 3" />;
  const xAxis = <XAxis dataKey="date" minTickGap={24} />;
  const yAxis = (
    <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
  );
  const tooltip = (
    <Tooltip
      formatter={(value: any, name: string) => [
        name === "price" ? (Number(value) as number).toFixed(2) : value,
        name === "price" ? "Price" : name === "volume" ? "Volume" : name,
      ]}
    />
  );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        {type === "line" ? (
          <LineChart
            data={formatted}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            {grid}
            {xAxis}
            {yAxis}
            <Tooltip
              content={renderTooltip}
              offset={12}
              cursor={{ stroke: "rgba(0,0,0,0.15)", strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        ) : type === "area" ? (
          <AreaChart
            data={formatted}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            {grid}
            {xAxis}
            {yAxis}
            <Tooltip
              content={renderTooltip}
              offset={12}
              cursor={{ stroke: "rgba(0,0,0,0.15)", strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              fill="rgba(59,130,246,0.2)"
            />
          </AreaChart>
        ) : showVolume ? (
          <ComposedChart
            data={formatted}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            {grid}
            {xAxis}
            {yAxis}
            <Tooltip
              content={renderTooltip}
              offset={12}
              cursor={{ stroke: "rgba(0,0,0,0.15)", strokeDasharray: "4 4" }}
            />
            <Bar dataKey="volume" fill="#10b981" yAxisId={1} />
            <YAxis
              yAxisId={1}
              orientation="right"
              tickFormatter={(v) => `${Math.round(v / 1e6)}M`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        ) : (
          <BarChart
            data={formatted}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            {grid}
            {xAxis}
            {yAxis}
            <Tooltip
              content={renderTooltip}
              offset={12}
              cursor={{ stroke: "rgba(0,0,0,0.15)", strokeDasharray: "4 4" }}
            />
            <Bar dataKey="price" fill="#3b82f6" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

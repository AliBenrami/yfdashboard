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
        price: d.price,
        volume: d.volume,
      })),
    [data]
  );

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
            {tooltip}
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
            {tooltip}
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
            {tooltip}
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
            {tooltip}
            <Bar dataKey="price" fill="#3b82f6" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

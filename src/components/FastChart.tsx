"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ChartData {
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

interface FastChartProps {
  data: ChartData[];
  height?: number;
  showVolume?: boolean;
}

export default function FastChart({
  data,
  height = 400,
  showVolume = true,
}: FastChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [hoveredPoint, setHoveredPoint] = useState<ChartData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const drawChart = useCallback(() => {
    if (!canvasRef.current || !data.length) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Set canvas size with high DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate chart dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const priceChartHeight = showVolume
      ? rect.height * 0.7 - padding
      : rect.height - padding * 2;
    const volumeChartHeight = showVolume ? rect.height * 0.3 - padding : 0;

    // Find min/max values
    const prices = data.map((d) => d.price);
    const volumes = data.map((d) => d.volume);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxVolume = Math.max(...volumes);

    // Price range with some padding
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;
    const adjustedMinPrice = minPrice - pricePadding;
    const adjustedMaxPrice = maxPrice + pricePadding;
    const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;

    // Draw grid lines
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (priceChartHeight * i) / 5;
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
    }

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (chartWidth * i) / 5;
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + priceChartHeight);
    }
    ctx.stroke();

    // Draw price chart
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y =
        padding +
        ((adjustedMaxPrice - point.price) / adjustedPriceRange) *
          priceChartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under the line
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
    ctx.lineTo(padding + chartWidth, padding + priceChartHeight);
    ctx.lineTo(padding, padding + priceChartHeight);
    ctx.fill();

    // Draw volume chart if requested
    if (showVolume && volumeChartHeight > 0) {
      const volumeStartY = padding + priceChartHeight + 20;

      ctx.fillStyle = "#10b981";
      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const barHeight = (point.volume / maxVolume) * volumeChartHeight;
        const y = volumeStartY + volumeChartHeight - barHeight;

        ctx.fillRect(x - 1, y, 2, barHeight);
      });
    }

    // Draw crosshair and highlight hovered point
    if (mousePos && hoveredIndex >= 0) {
      const hoveredX =
        padding + (hoveredIndex / (data.length - 1)) * chartWidth;
      const hoveredY =
        padding +
        ((adjustedMaxPrice - data[hoveredIndex].price) / adjustedPriceRange) *
          priceChartHeight;

      // Draw crosshair lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      // Vertical line
      ctx.moveTo(hoveredX, padding);
      ctx.lineTo(hoveredX, padding + priceChartHeight);

      // Horizontal line
      ctx.moveTo(padding, hoveredY);
      ctx.lineTo(padding + chartWidth, hoveredY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw hover point
      ctx.fillStyle = "#1d4ed8";
      ctx.beginPath();
      ctx.arc(hoveredX, hoveredY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw white border around point
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw price labels
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";

    for (let i = 0; i <= 5; i++) {
      const price = adjustedMaxPrice - (adjustedPriceRange * i) / 5;
      const y = padding + (priceChartHeight * i) / 5;
      ctx.fillText(`$${price.toFixed(2)}`, padding - 5, y + 4);
    }

    // Draw date labels
    ctx.textAlign = "center";
    const dateStep = Math.max(1, Math.floor(data.length / 5));
    for (let i = 0; i < data.length; i += dateStep) {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const date = new Date(data[i].date).toLocaleDateString();
      ctx.fillText(date, x, rect.height - 10);
    }

    return {
      padding,
      chartWidth,
      priceChartHeight,
      adjustedMinPrice,
      adjustedMaxPrice,
      adjustedPriceRange,
    };
  }, [data, height, showVolume, mousePos, hoveredIndex]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Mouse event handlers
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !data.length) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setMousePos({ x, y });

      // Find the closest data point
      const padding = 40;
      const chartWidth = rect.width - padding * 2;

      if (x >= padding && x <= padding + chartWidth) {
        const relativeX = (x - padding) / chartWidth;
        const index = Math.round(relativeX * (data.length - 1));
        const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

        setHoveredIndex(clampedIndex);
        setHoveredPoint(data[clampedIndex]);
      } else {
        setHoveredIndex(-1);
        setHoveredPoint(null);
      }
    },
    [data]
  );

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    setHoveredPoint(null);
    setHoveredIndex(-1);
  }, []);

  return (
    <div className="w-full relative" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="w-full border rounded-lg cursor-crosshair"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Tooltip */}
      {hoveredPoint && mousePos && (
        <div
          className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none z-10"
          style={{
            left: Math.min(
              mousePos.x + 10,
              (containerRef.current?.clientWidth || 0) - 200
            ),
            top: Math.max(mousePos.y - 80, 10),
          }}
        >
          <div className="text-sm font-semibold text-gray-800">
            {new Date(hoveredPoint.date).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="text-lg font-bold text-blue-600">
            ${hoveredPoint.price.toFixed(2)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
            <div>
              <span className="text-gray-500">Open:</span> $
              {hoveredPoint.open.toFixed(2)}
            </div>
            <div>
              <span className="text-gray-500">High:</span> $
              {hoveredPoint.high.toFixed(2)}
            </div>
            <div>
              <span className="text-gray-500">Low:</span> $
              {hoveredPoint.low.toFixed(2)}
            </div>
            <div>
              <span className="text-gray-500">Volume:</span>{" "}
              {(hoveredPoint.volume / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2 text-center">
        Interactive canvas chart • {data.length} data points • Hover for details
      </div>
    </div>
  );
}

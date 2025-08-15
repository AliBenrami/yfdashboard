"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";

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
  chartType?: "line" | "area" | "candlestick";
}

export default function FastChart({
  data,
  height = 400,
  showVolume = true,
  chartType = "line",
}: FastChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [hoveredPoint, setHoveredPoint] = useState<ChartData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const drawChart = useCallback(() => {
    if (!canvasRef.current || !data.length || canvasSize.width === 0)
      return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Use stored canvas size for consistency
    const rect = canvasSize;

    // Set canvas size with high DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate responsive padding based on screen size
    const basePadding = Math.min(40, rect.width * 0.1, rect.height * 0.1);
    const leftPadding = Math.max(50, basePadding); // Extra space for price labels
    const rightPadding = Math.max(20, basePadding * 0.5);
    const topPadding = Math.max(20, basePadding * 0.5);
    const bottomPadding = Math.max(30, basePadding); // Extra space for date labels

    const chartWidth = rect.width - leftPadding - rightPadding;
    const availableHeight = rect.height - topPadding - bottomPadding;

    const priceChartHeight = showVolume
      ? availableHeight * 0.7
      : availableHeight;
    const volumeChartHeight = showVolume ? availableHeight * 0.25 : 0;
    const volumeGap = showVolume ? availableHeight * 0.05 : 0;

    // Find min/max values for price axis based on chart type
    const volumes = data.map((d) => d.volume);
    const minPrice =
      chartType === "candlestick"
        ? Math.min(...data.map((d) => d.low))
        : Math.min(...data.map((d) => d.price));
    const maxPrice =
      chartType === "candlestick"
        ? Math.max(...data.map((d) => d.high))
        : Math.max(...data.map((d) => d.price));
    const maxVolume = Math.max(...volumes);

    // Dynamic price range with padding for better scaling on short ranges
    const baseRange = Math.max(1e-6, maxPrice - minPrice);
    const padding = baseRange * 0.1;
    const adjustedMinPrice = Math.max(0, minPrice - padding);
    const adjustedMaxPrice = maxPrice + padding;
    const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;

    // Draw grid lines
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = topPadding + (priceChartHeight * i) / 5;
      ctx.moveTo(leftPadding, y);
      ctx.lineTo(leftPadding + chartWidth, y);
    }

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = leftPadding + (chartWidth * i) / 5;
      ctx.moveTo(x, topPadding);
      ctx.lineTo(x, topPadding + priceChartHeight);
    }
    ctx.stroke();

    // Draw price chart by type
    if (chartType === "candlestick") {
      const candleWidth = Math.min(
        20,
        Math.max(2, (chartWidth / data.length) * 0.6)
      );
      data.forEach((point, index) => {
        const x = leftPadding + (index / (data.length - 1)) * chartWidth;
        const yHigh =
          topPadding +
          ((adjustedMaxPrice - point.high) / adjustedPriceRange) *
            priceChartHeight;
        const yLow =
          topPadding +
          ((adjustedMaxPrice - point.low) / adjustedPriceRange) *
            priceChartHeight;
        const yOpen =
          topPadding +
          ((adjustedMaxPrice - point.open) / adjustedPriceRange) *
            priceChartHeight;
        const yClose =
          topPadding +
          ((adjustedMaxPrice - point.price) / adjustedPriceRange) *
            priceChartHeight;

        const isUp = point.price >= point.open;
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));

        // Wick
        ctx.strokeStyle = isUp ? "#10b981" : "#ef4444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Body
        ctx.fillStyle = isUp ? "#10b981" : "#ef4444";
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      });
    } else {
      // Line/Area chart
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = leftPadding + (index / (data.length - 1)) * chartWidth;
        const y =
          topPadding +
          ((adjustedMaxPrice - point.price) / adjustedPriceRange) *
            priceChartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      if (chartType === "area") {
        // Fill area under the line
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
        ctx.lineTo(leftPadding + chartWidth, topPadding + priceChartHeight);
        ctx.lineTo(leftPadding, topPadding + priceChartHeight);
        ctx.fill();
      }
    }

    // Draw volume chart if requested
    if (showVolume && volumeChartHeight > 0) {
      const volumeStartY = topPadding + priceChartHeight + volumeGap;

      data.forEach((point, index) => {
        const x = leftPadding + (index / (data.length - 1)) * chartWidth;
        const barHeight = (point.volume / maxVolume) * volumeChartHeight;
        const y = volumeStartY + volumeChartHeight - barHeight;

        if (chartType === "candlestick") {
          const isUp = point.price >= point.open;
          ctx.fillStyle = isUp
            ? "rgba(16, 185, 129, 0.6)"
            : "rgba(239, 68, 68, 0.6)";
        } else {
          ctx.fillStyle = "#10b981";
        }
        ctx.fillRect(x - 1, y, 2, barHeight);
      });
    }

    // Draw crosshair and highlight hovered point
    if (mousePos && hoveredIndex >= 0) {
      const hoveredX =
        leftPadding + (hoveredIndex / (data.length - 1)) * chartWidth;
      const hoveredValue =
        chartType === "candlestick"
          ? data[hoveredIndex].price
          : data[hoveredIndex].price;
      const hoveredY =
        topPadding +
        ((adjustedMaxPrice - hoveredValue) / adjustedPriceRange) *
          priceChartHeight;

      // Draw crosshair lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      // Vertical line
      ctx.moveTo(hoveredX, topPadding);
      ctx.lineTo(hoveredX, topPadding + priceChartHeight);

      // Horizontal line
      ctx.moveTo(leftPadding, hoveredY);
      ctx.lineTo(leftPadding + chartWidth, hoveredY);
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
    ctx.font = `${Math.max(10, Math.min(12, rect.width / 50))}px sans-serif`;
    ctx.textAlign = "right";

    for (let i = 0; i <= 5; i++) {
      const price = adjustedMaxPrice - (adjustedPriceRange * i) / 5;
      const y = topPadding + (priceChartHeight * i) / 5;
      ctx.fillText(`$${price.toFixed(2)}`, leftPadding - 5, y + 4);
    }

    // Draw date labels
    ctx.textAlign = "center";
    const maxLabels = Math.floor(chartWidth / 80); // Responsive number of labels
    const dateStep = Math.max(1, Math.floor(data.length / maxLabels));
    for (let i = 0; i < data.length; i += dateStep) {
      const x = leftPadding + (i / (data.length - 1)) * chartWidth;
      const date = new Date(data[i].date).toLocaleDateString();
      ctx.fillText(date, x, rect.height - bottomPadding + 20);
    }

    return {
      leftPadding,
      chartWidth,
      priceChartHeight,
      adjustedMinPrice,
      adjustedMaxPrice,
      adjustedPriceRange,
    };
  }, [data, height, showVolume, mousePos, hoveredIndex, canvasSize, chartType]);

  // Handle canvas resizing
  useLayoutEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height });
      }
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [height]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Mouse event handlers
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !data.length || canvasSize.width === 0) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setMousePos({ x, y });

      // Calculate responsive padding (same as in drawChart)
      const basePadding = Math.min(
        40,
        canvasSize.width * 0.1,
        canvasSize.height * 0.1
      );
      const leftPadding = Math.max(50, basePadding);
      const rightPadding = Math.max(20, basePadding * 0.5);
      const chartWidth = canvasSize.width - leftPadding - rightPadding;

      if (x >= leftPadding && x <= leftPadding + chartWidth) {
        const relativeX = (x - leftPadding) / chartWidth;
        const index = Math.round(relativeX * (data.length - 1));
        const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

        setHoveredIndex(clampedIndex);
        setHoveredPoint(data[clampedIndex]);
      } else {
        setHoveredIndex(-1);
        setHoveredPoint(null);
      }
    },
    [data, canvasSize]
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

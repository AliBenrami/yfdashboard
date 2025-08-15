"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
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

  // Determine overall date span to drive tick/tooltip formatting
  const dateSpanDays = useMemo(() => {
    if (data.length < 2) return 0;
    const first = new Date(data[0].date).getTime();
    const last = new Date(data[data.length - 1].date).getTime();
    return Math.max(0, Math.round((last - first) / (1000 * 60 * 60 * 24)));
  }, [data]);

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
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
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

    // Draw date labels (condensed)
    ctx.textAlign = "center";
    const maxLabels = Math.max(2, Math.floor(chartWidth / 120));
    const dateStep = Math.max(1, Math.ceil(data.length / maxLabels));
    const formatDateLabel = (dateStr: string) => {
      const d = new Date(dateStr);
      if (dateSpanDays <= 31) {
        return d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      } else if (dateSpanDays <= 366) {
        return d.toLocaleDateString(undefined, { month: "short" });
      } else {
        return d.toLocaleDateString(undefined, { year: "numeric" });
      }
    };
    for (let i = 0; i < data.length; i += dateStep) {
      const x = leftPadding + (i / (data.length - 1)) * chartWidth;
      const label = formatDateLabel(data[i].date);
      ctx.fillText(label, x, rect.height - bottomPadding + 16);
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

  // Compute tooltip position with smart flipping to avoid overlapping cursor/edges
  const tooltipPos = useMemo(() => {
    if (!mousePos) return null;
    const tooltipWidth = 180;
    const tooltipHeight = 78;
    const padding = 16;

    const containerWidth = containerRef.current?.clientWidth || 0;
    const containerHeight = containerRef.current?.clientHeight || height;

    const preferRight = mousePos.x < containerWidth / 2;
    const preferBelow = mousePos.y < containerHeight / 2;

    let left = preferRight
      ? mousePos.x + padding
      : mousePos.x - tooltipWidth - padding;

    let top = preferBelow
      ? mousePos.y + padding
      : mousePos.y - tooltipHeight - padding;

    // Edge-aware flipping if necessary
    if (left + tooltipWidth > containerWidth - 8) {
      left = Math.max(8, mousePos.x - tooltipWidth - padding);
    } else if (left < 8) {
      left = Math.min(containerWidth - tooltipWidth - 8, mousePos.x + padding);
    }

    if (top + tooltipHeight > containerHeight - 8) {
      top = Math.max(8, mousePos.y - tooltipHeight - padding);
    } else if (top < 8) {
      top = Math.min(containerHeight - tooltipHeight - 8, mousePos.y + padding);
    }

    // Final clamping inside container
    left = Math.min(
      Math.max(8, left),
      Math.max(8, containerWidth - tooltipWidth - 8)
    );
    top = Math.min(
      Math.max(8, top),
      Math.max(8, containerHeight - tooltipHeight - 8)
    );

    return { left, top };
  }, [mousePos, height]);

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
      {hoveredPoint && mousePos && tooltipPos && (
        <div
          className="absolute rounded-md pointer-events-none z-10"
          style={{
            left: tooltipPos.left,
            top: tooltipPos.top,
          }}
        >
          <div className="backdrop-blur-md bg-white/70 dark:bg-black/50 border border-black/5 shadow-sm px-3 py-2 rounded-md">
            <div className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
              {dateSpanDays <= 31
                ? new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(hoveredPoint.date))
                : dateSpanDays <= 366
                ? new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    year: "2-digit",
                  }).format(new Date(hoveredPoint.date))
                : new Intl.DateTimeFormat(undefined, {
                    year: "numeric",
                  }).format(new Date(hoveredPoint.date))}
            </div>
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              ${hoveredPoint.price.toFixed(2)}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-600 dark:text-gray-300 mt-1">
              <span>O {hoveredPoint.open.toFixed(2)}</span>
              <span>H {hoveredPoint.high.toFixed(2)}</span>
              <span>L {hoveredPoint.low.toFixed(2)}</span>
              <span>V {(hoveredPoint.volume / 1_000_000).toFixed(1)}M</span>
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

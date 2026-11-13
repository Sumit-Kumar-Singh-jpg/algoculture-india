"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Crosshair,
  Pencil,
  Minus,
  TrendingUp,
  Square,
  Type,
  Ruler,
  Trash2,
  Undo2,
  Redo2,
  Palette,
} from "lucide-react";

export type DrawingToolType =
  | "cursor"
  | "pencil"
  | "trendline"
  | "horizontal"
  | "rectangle"
  | "text"
  | "ruler";

export interface DrawingItem {
  id: string;
  type: DrawingToolType;
  color: string;
  lineWidth: number;
  points: Array<{ x: number; y: number }>;
  text?: string;
}

interface DrawingCanvasOverlayProps {
  width: number;
  height: number;
  currentPrice?: number;
  activeTool: DrawingToolType;
  onChangeTool: (tool: DrawingToolType) => void;
  activeColor: string;
  onChangeColor: (color: string) => void;
  activeLineWidth: number;
  onChangeLineWidth: (width: number) => void;
  drawings: DrawingItem[];
  setDrawings: React.Dispatch<React.SetStateAction<DrawingItem[]>>;
  undoStack: DrawingItem[][];
  setUndoStack: React.Dispatch<React.SetStateAction<DrawingItem[][]>>;
  redoStack: DrawingItem[][];
  setRedoStack: React.Dispatch<React.SetStateAction<DrawingItem[][]>>;
}

export function DrawingCanvasOverlay({
  width,
  height,
  currentPrice,
  activeTool,
  onChangeTool,
  activeColor,
  onChangeColor,
  activeLineWidth,
  onChangeLineWidth,
  drawings,
  setDrawings,
  undoStack,
  setUndoStack,
  redoStack,
  setRedoStack,
}: DrawingCanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputVal, setTextInputVal] = useState("");

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw completed drawings
    for (const item of drawings) {
      drawShape(ctx, item);
    }

    // 2. Draw active shape in progress
    if (isDrawing && currentPoints.length > 0) {
      drawShape(ctx, {
        id: "active",
        type: activeTool,
        color: activeColor,
        lineWidth: activeLineWidth,
        points: currentPoints,
      });
    }
  }, [drawings, isDrawing, currentPoints, activeTool, activeColor, activeLineWidth]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, width, height]);

  function drawShape(ctx: CanvasRenderingContext2D, item: DrawingItem) {
    if (item.points.length === 0) return;
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = item.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (item.type === "pencil") {
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (let i = 1; i < item.points.length; i++) {
        ctx.lineTo(item.points[i].x, item.points[i].y);
      }
      ctx.stroke();
    } else if (item.type === "trendline" && item.points.length >= 2) {
      const p1 = item.points[0];
      const p2 = item.points[item.points.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // End-point circles
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
      ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === "horizontal" && item.points.length >= 1) {
      const y = item.points[0].y;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Right-side level tag
      ctx.setLineDash([]);
      ctx.fillStyle = item.color;
      ctx.fillRect(width - 55, y - 9, 52, 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.text || "Level", width - 29, y);
    } else if (item.type === "rectangle" && item.points.length >= 2) {
      const p1 = item.points[0];
      const p2 = item.points[item.points.length - 1];
      const rx = Math.min(p1.x, p2.x);
      const ry = Math.min(p1.y, p2.y);
      const rw = Math.abs(p2.x - p1.x);
      const rh = Math.abs(p2.y - p1.y);

      // Translucent fill
      ctx.fillStyle = item.color + "22";
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (item.type === "text" && item.points.length >= 1) {
      const p = item.points[0];
      ctx.font = "bold 11px sans-serif";
      const text = item.text || "Note";
      const metrics = ctx.measureText(text);
      ctx.fillStyle = "#090d16cc";
      ctx.fillRect(p.x - 4, p.y - 14, metrics.width + 8, 18);
      ctx.strokeStyle = item.color;
      ctx.strokeRect(p.x - 4, p.y - 14, metrics.width + 8, 18);
      ctx.fillStyle = item.color;
      ctx.fillText(text, p.x, p.y);
    } else if (item.type === "ruler" && item.points.length >= 2) {
      const p1 = item.points[0];
      const p2 = item.points[item.points.length - 1];
      const dy = p1.y - p2.y;
      const dx = p2.x - p1.x;

      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Measurement tag
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.setLineDash([]);
      const diffLabel = `${dy > 0 ? "+" : ""}${(dy * 0.1).toFixed(2)} pts`;
      ctx.fillStyle = dy >= 0 ? "#10b981ee" : "#f43f5eee";
      ctx.fillRect(midX - 35, midY - 10, 70, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(diffLabel, midX, midY);
    }

    ctx.restore();
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (activeTool === "cursor") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "text") {
      setTextInputPos({ x, y });
      setTextInputVal("");
      return;
    }

    if (activeTool === "horizontal") {
      const newItem: DrawingItem = {
        id: String(Date.now()),
        type: "horizontal",
        color: activeColor,
        lineWidth: activeLineWidth,
        points: [{ x, y }],
        text: currentPrice ? `₹${currentPrice.toFixed(1)}` : "S/R",
      };
      setUndoStack((prev) => [...prev, drawings]);
      setRedoStack([]);
      setDrawings((prev) => [...prev, newItem]);
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || activeTool === "cursor") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "pencil") {
      setCurrentPoints((prev) => [...prev, { x, y }]);
    } else {
      // 2-point shapes (trendline, rectangle, ruler)
      setCurrentPoints((prev) => [prev[0], { x, y }]);
    }
  }

  function handleMouseUp() {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    const newItem: DrawingItem = {
      id: String(Date.now()),
      type: activeTool,
      color: activeColor,
      lineWidth: activeLineWidth,
      points: currentPoints,
    };

    setUndoStack((prev) => [...prev, drawings]);
    setRedoStack([]);
    setDrawings((prev) => [...prev, newItem]);
    setIsDrawing(false);
    setCurrentPoints([]);
  }

  function handleSaveText(e: React.FormEvent) {
    e.preventDefault();
    if (!textInputPos || !textInputVal.trim()) {
      setTextInputPos(null);
      return;
    }
    const newItem: DrawingItem = {
      id: String(Date.now()),
      type: "text",
      color: activeColor,
      lineWidth: activeLineWidth,
      points: [textInputPos],
      text: textInputVal.trim(),
    };
    setUndoStack((prev) => [...prev, drawings]);
    setRedoStack([]);
    setDrawings((prev) => [...prev, newItem]);
    setTextInputPos(null);
    setTextInputVal("");
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`absolute inset-0 z-20 ${
          activeTool === "cursor"
            ? "pointer-events-none"
            : "pointer-events-auto cursor-crosshair"
        }`}
      />

      {/* Inline Text Input Dialog on click */}
      {textInputPos && (
        <form
          onSubmit={handleSaveText}
          className="absolute z-30 flex items-center gap-1 rounded border border-slate-700 bg-slate-900 p-1 shadow-lg"
          style={{ left: textInputPos.x, top: textInputPos.y - 12 }}
        >
          <input
            type="text"
            autoFocus
            value={textInputVal}
            onChange={(e) => setTextInputVal(e.target.value)}
            placeholder="Type note & hit Enter..."
            className="rounded bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            className="rounded bg-sky-500 px-2 py-1 text-xs font-semibold text-white"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setTextInputPos(null)}
            className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </form>
      )}
    </>
  );
}

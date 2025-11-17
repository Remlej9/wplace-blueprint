"use client";

import { useEffect, useRef, useState } from "react";

type ImageEditorProps = {
  src: string;
  alt?: string;
};

export default function ImageEditor({ src, alt = "Edited Image" }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [ size, setSize ] = useState(128); 
  const [ custom, setCustom ] = useState(false);
  const [ freeMode, setFreeMode ] = useState(false);

  const freeColorsHex = [
    "#000000", // Black
    "#3c3c3c", // Dark Gray
    "#787878", // Gray
    "#d2d2d2", // Light Gray
    "#ffffff", // White
    "#600018", // Deep Red
    "#ed1c24", // Red
    "#ff7f27", // Orange
    "#f6aa09", // Gold
    "#f9dd3b", // Yellow
    "#fffabc", // Light Yellow
    "#0eb968", // Dark Green
    "#13e67b", // Green
    "#87ff5e", // Light Green
    "#0c816e", // Dark Teal
    "#10aea6", // Teal
    "#13e1bc", // Light Teal
    "#60f7f2", // Cyan
    "#28509e", // Dark Blue
    "#4093e4", // Blue
    "#6b50f6", // Indigo
    "#99b1fb", // Light Indigo
    "#780c99", // Dark Purple
    "#aa38b9", // Purple
    "#e09ff9", // Light Purple
    "#cb007a", // Dark Pink
    "#ec1f80", // Pink
    "#f38da9", // Light Pink
    "#684634", // Dark Brown
    "#95682a", // Brown
    "#f8b277", // Beige
  ];

  // convert hex colors to rgb
  const freeColors = freeColorsHex.map(color => {
    if (typeof color === "string") {
      const bigint = parseInt(color.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return [r, g, b];
    }
    return color;
  });

  const premiumColorsHex = [
    "#aaaaaa", // Medium Gray
    "#a50e1e", // Dark Red
    "#fa8072", // Light Red
    "#e45c1a", // Dark Orange
    "#9c8431", // Dark Goldenrod
    "#c5ad31", // Goldenrod
    "#e8d45f", // Light Goldenrod
    "#4a6b3a", // Dark Olive
    "#5a944a", // Olive
    "#84c573", // Light Olive
    "#0f799f", // Dark Cyan
    "#bbfaf2", // Light Cyan
    "#7dc7ff", // Light Blue
    "#4d31b8", // Dark Indigo
    "#4a4284", // Dark Slate Blue
    "#7a71c4", // Slate Blue
    "#b5aef1", // Light Slate Blue
    "#9b5249", // Dark Peach
    "#d18078", // Peach
    "#fab6a4", // Light Peach
    "#dba463", // Light Brown
    "#7b6352", // Dark Tan
    "#9c846b", // Tan
    "#d6b594", // Light Tan
    "#d18051", // Dark Biege
    "#ffc5a5", // Light Biege
    "#6d643f", // Dark Stone
    "#948c6b", // Stone
    "#cdc59e", // Light Stone
    "#333941", // Dark Slate
    "#6d758d", // Slate
    "#b3b9d1", // Light Slate
  ];

  // convert hex colors to rgb
  const premiumColors = premiumColorsHex.map(color => {
    if (typeof color === "string") {
      const bigint = parseInt(color.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return [r, g, b];
    }
    return color;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();

    image.src = src;

    image.onload = () => {
      // Set canvas size
      canvas.width = size;
      canvas.height = size;

      // Nearest neighbor scaling
      ctx.imageSmoothingEnabled = false;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      const fitScale = Math.min(
        canvas.width / image.width,
        canvas.height / image.height
      );

      const drawWidth = image.width * fitScale;
      const drawHeight = image.height * fitScale;

      // Draw the image scaled to fit the canvas
      ctx.drawImage(
        image,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      // Map pixels to available colors
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Get original colors
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) {
          // Transparent pixel, skip
          continue;
        }

        // Find the nearest color from free and premium palettes if not in free mode
        const palette = freeMode ? freeColors : freeColors.concat(premiumColors);
        let nearestColor = palette[0];
        let minDistance = Infinity;
        for (const color of palette) {
          const dr = r - color[0];
          const dg = g - color[1];
          const db = b - color[2];
          const distance = dr * dr + dg * dg + db * db;
          if (distance < minDistance) {
            minDistance = distance;
            nearestColor = color;
          }
        }

        // Set pixel to nearest color
        data[i] = nearestColor[0];
        data[i + 1] = nearestColor[1];
        data[i + 2] = nearestColor[2];
        data[i + 3] = a; // Preserve alpha

      }

      ctx.putImageData(imageData, 0, 0);

      };
    }, [src, size]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Preview area */}
      <div className="relative w-full aspect-square rounded-2xl border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          aria-label={alt}
          className="w-full h-full [image-rendering:pixelated] [image-rendering:crisp-edges]"
        />
        {/* Canvas size display in bottom-right corner of image */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-lg">
          {size} x {size} ({size * size} px)
        </div>
      </div>

      {/* Grid Size */}
      <div className="space-y-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Canvas Size
          </h2>
        </div>

        {/* Scale presets dropdown menu */}
        <div className="mb-4">
          <select
            value={custom ? "custom" : size.toString()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "custom") {
                setCustom(true);
              } else {
                setCustom(false);
                setSize(Number(value));
              }
            }}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            <option value="32">32 x 32</option>
            <option value="64">64 x 64</option>
            <option value="128">128 x 128</option>
            <option value="256">256 x 256</option>
            <option value="512">512 x 512</option>
            <option value="custom">Custom</option>
          </select>
        </div>


        {/* Custom size */}
        {custom && (
        <ControlRow
          label="Size"
          value={size}
          min={1}
          max={2048}
          step={1}
          onChange={setSize}
        />)}
      </div>
    </div>
  );
}

type ControlRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};


function ControlRow({ label, value, min, max, step = 1, onChange }: ControlRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}
          <span className="ml-0.5">x</span>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}
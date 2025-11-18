// ImageEditor.tsx

// TODO: Custom color selection, more editing tools

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { PALETTE, hexToRgb } from "@/lib/palette";

type ImageEditorProps = {
  src: string;
  alt?: string;
  onUploadClick: () => void;
};

type usedColor = {
  hex: string;
  name?: string;
  count: number;
};

export default function ImageEditor({ src, alt = "Edited Image", onUploadClick }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [ size, setSize ] = useState(128); 
  const [ custom, setCustom ] = useState(false);
  const [ freeMode, setFreeMode ] = useState(false);
  const [ transparentPixels, setTransparentPixels ] = useState(0);
  const [ usedColorsData, setUsedColorsData ] = useState<usedColor[]>([]);
  const [ minimumPixels, setMinimumPixels ] = useState(0);

  // Prepare color palettes
  const activePalette = useMemo(
    () =>
      (freeMode ? 
        PALETTE.filter((color) => color.tier === "free") : 
        PALETTE
      ).map((color) => ({
        ...color,
        rgb: hexToRgb(color.hex),
      })),
    [freeMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();

    image.src = src;

    image.onload = () => {

      if (size <= 0) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setUsedColorsData([]);
        setTransparentPixels(0);
        return;
      }

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

      let transparentCount = 0;
      const colorCounts = new Map<string, { name: string; count: number }>();

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a <= 0.1) {
          transparentCount++;
          continue;
        }

        let nearest = activePalette[0];
        let minDistance = Infinity;

        for (const color of activePalette) {
          const [cr, cg, cb] = color.rgb;
          const dr = r - cr;
          const dg = g - cg;
          const db = b - cb;
          const distance = dr * dr + dg * dg + db * db;
          if (distance < minDistance) {
            minDistance = distance;
            nearest = color;
          }
        }

        const [nr, ng, nb] = nearest.rgb;
        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
        data[i + 3] = 255;

        const hex = nearest.hex;

        const currentData = colorCounts.get(hex);
        if (currentData) {
          currentData.count += 1;
        } else {
          colorCounts.set(hex, { name: nearest.name, count: 1 });
        }
      }

      const sortedUsedColors: UsedColor[] = Array.from(colorCounts.entries())
        .map(([hex, { name, count }]) => ({ hex, name, count }))
        .sort((a, b) => b.count - a.count);

      setUsedColorsData(sortedUsedColors);
      setTransparentPixels(transparentCount);

      ctx.putImageData(imageData, 0, 0);

      };
    }, [src, size, freeMode, activePalette, minimumPixels]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      {/* Preview area */}
      <div className="flex flex-col gap-3 w-full md:w-1/2">
        <div className="relative w-full aspect-square border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            aria-label={alt}
            className="w-full h-full [image-rendering:pixelated] [image-rendering:crisp-edges]"
          />
          {/* Canvas size display in bottom-right corner of image */}
          <div className="absolute bottom-2 right-2 bg-black/50 bg-opacity-0 text-white text-xs px-2 py-1 rounded-lg">
            {size} x {size} ({size * size} px)
          </div>


          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
            {(size * size - transparentPixels) >= 0 ? size * size - transparentPixels : 0} pixels to paint
          </div>

          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 bg-white dark:bg-blue-600/50 hover:bg-opacity-100 text-gray-800 dark:text-gray-100 text-xs px-3 py-1 rounded-lg transition"
          >
            Download PNG
          </button>

        </div>

        {/* Upload another image */}
        <button
          type="button"
          onClick={onUploadClick}
          className="w-full text-sm text-gray-500 dark:text-gray-200 cursor-pointer bg-gray-100 dark:bg-gray-700 p-2 rounded-lg hover:bg-gray-200 hover:dark:bg-gray-600 transition"
        >
          Upload Another Image
        </button>
      </div>

      {/* Grid Size */}
      <div className="w-full md:w-1/2 space-y-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
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
          min={0}
          max={1048}
          step={1}
          onChange={setSize}
        />)}

        {/* Free mode toggle */}
        <div className="flex items-center space-x-3 mt-2">
          <button
            type="button"
            role="switch"
            aria-checked={freeMode}
            onClick={() => setFreeMode(!freeMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition
              ${freeMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition
                ${freeMode ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>

          <span className="text-sm text-gray-700 dark:text-gray-300">
            Free Mode (Use Free Colors Only)
          </span>
        </div>

        {/* Color display */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
            Available Colors ({activePalette.length})
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Disable colors manually by clicking on them (TODO)
          </p>
          <div className="flex gap-1 items-center max-h-48 overflow-y-auto p-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
            {activePalette.map((color) => (
              <div
                key={color.hex}
                className="aspect-square h-8 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Used colors display */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
            Colors in image ({usedColorsData.length})
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Sorted by pixel count
          </p>
          <div className="flex gap-1 items-center max-h-48 overflow-y-auto p-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
            {usedColorsData.map((data) => (
              <div
                key={data.hex}
                className="aspect-square h-8 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: data.hex }}
                title={`${data.name} (${data.count} pixels)`}
              />
            ))}
          </div>
        </div>

        {/* Remove colors with less than x pixels - TODO */}
        <div className="mt-4">
          <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
            <span>Remove colors with less than</span>
            <span className="tabular-nums">
              {minimumPixels} pixels
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10000}
            step={1}
            value={minimumPixels}
            onChange={(e) => setMinimumPixels(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          </div>
        </div>
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
          <input type="text" value={value}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val)) {
                if (val >= min && val <= max) {
                  onChange(val);
                }
              }
            }}
            className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-right"
          />
          <span className="ml-0.5 mr-0.5">x</span>
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
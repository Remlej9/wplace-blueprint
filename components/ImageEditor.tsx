// ImageEditor.tsx

// TODO: Custom color selection, more editing tools

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { PALETTE, hexToRgb } from "@/lib/palette";

type ImageEditorProps = {
  src: string;
  alt?: string;
  onUploadClick: () => void;
  onFileDrop?: (file: File) => void;
};

type UsedColor = {
  hex: string;
  name?: string;
  count: number;
  tier?: "free" | "premium";
};

type HoverInfo = {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    a: number;
    hex: string;
    tier?: "free" | "premium";
    name?: string;
};

export default function ImageEditor({ src, alt = "Edited Image", onUploadClick, onFileDrop }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [ size, setSize ] = useState(128); 
  const [ custom, setCustom ] = useState(false);
  const [ freeMode, setFreeMode ] = useState(false);
  const [ transparentPixels, setTransparentPixels ] = useState(0);
  const [ usedColorsData, setUsedColorsData ] = useState<UsedColor[]>([]);
  const [ colorLimit, setColorLimit ] = useState(0);
  const [ showGrid, setShowGrid ] = useState(true);
  const [ hoverPixel, setHoverPixel ] = useState<{ x: number; y: number } | null>(null);
  const [ hoverInfo, setHoverInfo ] = useState<HoverInfo | null>(null);
  const [ isDraggingOverCanvas, setIsDraggingOverCanvas ] = useState(false);

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
      const colorCounts = new Map<string, { name?: string; tier?: "free" | "premium"; count: number }>();

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
          colorCounts.set(hex, { name: nearest.name, tier: nearest.tier, count: 1 });
        }
      }

      const sortedUsedColors: UsedColor[] = Array.from(colorCounts.entries())
        .map(([hex, { name, tier, count }]) => ({ hex, name, tier, count }))
        .sort((a, b) => b.count - a.count);

      setUsedColorsData(sortedUsedColors);
      setTransparentPixels(transparentCount);

      let finalImageData = imageData;

      // Only re-quantize if a reduction limit > 0 is set AND the limit is less than the total used colors.
      if (colorLimit > 0 && colorLimit < sortedUsedColors.length) {
          
          // 1. Determine the reduced palette: the top N most frequent colors
          const reducedPaletteData = sortedUsedColors.slice(0, colorLimit);
          const reducedPalette = new Map<string, [number, number, number]>();

          // Convert reduced HEX colors to RGB for faster comparison
          reducedPaletteData.forEach(color => {
              const [r, g, b] = hexToRgb(color.hex); // Assuming hexToRgb utility is available
              reducedPalette.set(color.hex, [r, g, b]);
          });
          
          // Get the RGB of the color you will use for *all* colors outside the limit
          // The closest color is often the most frequent one (index 0)
          const fallbackColorHex = reducedPaletteData[0].hex;
          const [fr, fg, fb] = hexToRgb(fallbackColorHex);
          
          // 2. Process the image data again
          const finalData = finalImageData.data;
          
          // Map used HEX codes to their presence in the reduced palette
          const isReducedColor = new Set(reducedPaletteData.map(c => c.hex));

          // Loop through the *already* paletted image data
          for (let i = 0; i < finalData.length; i += 4) {
              // Skip transparent pixels (alpha 0)
              if (finalData[i + 3] === 0) {
                  continue;
              }
              
              const r = finalData[i];
              const g = finalData[i + 1];
              const b = finalData[i + 2];
              
              let nearest = { hex: fallbackColorHex, rgb: [fr, fg, fb] };
              let minDistance = Infinity;

              // Iterate over the much smaller *reduced* palette (top N)
              for (const hex of reducedPalette.keys()) {
                  const [cr, cg, cb] = reducedPalette.get(hex)!;
                  const dr = r - cr;
                  const dg = g - cg;
                  const db = b - cb;
                  const distance = dr * dr + dg * dg + db * db;
                  
                  if (distance < minDistance) {
                      minDistance = distance;
                      nearest = { hex, rgb: [cr, cg, cb] };
                  }
              }
              
              const [nr, ng, nb] = nearest.rgb;
              finalData[i] = nr;
              finalData[i + 1] = ng;
              finalData[i + 2] = nb;
              finalData[i + 3] = 255;
          }
      }

      // --- END: Color Reduction Logic ---

      ctx.putImageData(finalImageData, 0, 0);

      };
    }, [src, size, freeMode, activePalette, colorLimit]);

  useEffect(() => {
    const newMaxColors = usedColorsData.length;

    if (colorLimit === 0 || colorLimit !== newMaxColors) {
      setColorLimit(newMaxColors)
    }

  }, [ usedColorsData.length, setColorLimit ]);

  // useEffect for grid canvas
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const baseCanvas = canvasRef.current;
    if (!gridCanvas || !baseCanvas) return;

    const rect = baseCanvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;

    // Match the on-screen size in device pixels
    gridCanvas.width = rect.width * dpr;
    gridCanvas.height = rect.height * dpr;

    const ctx = gridCanvas.getContext("2d");
    if (!ctx) return;

    // Clear previous grid
    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    if (!showGrid || size <= 0 || size > 128) return;

    ctx.save();

    // Draw at device pixel ratio
    ctx.scale(dpr, dpr);

    // Draw crisp 1px grid aligned to pixel boundaries
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineWidth = 0.2;

    const cellWidth = rect.width / size;
    const cellHeight = rect.height / size;

    ctx.beginPath();

    // Vertical lines
    for (let i = 0; i <= size; i++) {
      const x = i * cellWidth - 0.5; // Align to pixel boundary
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
    }

    // Horizontal lines
    for (let i = 0; i <= size; i++) {
      const y = i * cellHeight - 0.5; // Align to pixel boundary
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
    }

    ctx.stroke();

    ctx.restore();
  }, [size, showGrid]);

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
        <div className={`relative w-full aspect-square border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition 
          ${isDraggingOverCanvas ? "ring-2 ring-blue-400 ring-offset-2" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOverCanvas(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDraggingOverCanvas(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOverCanvas(false);

          if (!onFileDrop) return;

          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) {
            onFileDrop(file);
          }
        }}>
          <canvas
            ref={canvasRef}
            aria-label={alt}
            className="w-full h-full [image-rendering:pixelated] [image-rendering:crisp-edges]"
            onMouseMove={(e) => {
              const canvas = canvasRef.current;
              if (!canvas) return;

              const rect = canvas.getBoundingClientRect();
              const scaleX = canvas.width / rect.width;
              const scaleY = canvas.height / rect.height;

              const x = Math.floor((e.clientX - rect.left) * scaleX);
              const y = Math.floor((e.clientY - rect.top) * scaleY);

              if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                setHoverPixel({ x, y });

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                let pixelData: Uint8ClampedArray;

                try {
                  const { data } = ctx.getImageData(x, y, 1, 1);
                  pixelData = data;
                } catch (error) {
                  // Out of bounds or other error
                  console.error("Error getting pixel data:", error);
                  setHoverInfo(null);
                  return;
                }

                const [r, g, b, a] = pixelData;

                if (a === 0) {
                  setHoverInfo({ x, y, r, g, b, a, hex: "", name: "Transparent" });
                  return;
                }

                const paletteMatch = PALETTE.find(
                  (c) => c.hex.toLowerCase() === rgbToHex(r, g, b).toLowerCase()
                );

                setHoverInfo({
                  x,
                  y,
                  r,
                  g,
                  b,
                  a,
                  hex: rgbToHex(r, g, b),
                  tier: paletteMatch?.tier,
                  name: paletteMatch?.name,
                });

              } else {
                setHoverPixel(null);
                setHoverInfo(null);
              }
            }}
            onMouseLeave={() => {
              setHoverPixel(null)
              setHoverInfo(null);
            }}
          />

          {/* Grid Overlay */}
          <canvas
            ref={gridCanvasRef}
            className="pointer-events-none absolute inset-0 w-full h-full [image-rendering:pixelated] [image-rendering:crisp-edges]"
          />


          {/* Canvas size display in bottom-right corner of image */}
          <div className="absolute bottom-2 right-2 bg-black/50 bg-opacity-0 text-white text-xs px-2 py-1 rounded-lg">
            {size} x {size} ({size * size} px)
          </div>

          {/* Display pixels to paint in bottom-left corner */}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
            {(size * size - transparentPixels) >= 0 ? size * size - transparentPixels : 0} pixels to paint
          </div>

          {/* Hover info display in top-left corner of image */}
          {hoverInfo && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
              <div>
                <div className="inline-block w-3 h-3 mr-1 align-middle rounded-sm"
                  style={{ backgroundColor: hoverInfo.hex }}
                ></div>
                {hoverInfo.tier === "free" ? (
                  <div className="inline align-middle">
                  {hoverInfo.name ? `${hoverInfo.name} ` : ""}
                  </div>
                ) : hoverInfo.tier === "premium" ? (
                  <div className="inline align-middle text-yellow-300 dark:text-yellow-500">
                  {hoverInfo.name ? `${hoverInfo.name} ` : ""}
                  (premium)
                  </div>
                ) : (
                  <div className="inline align-middle">
                  {hoverInfo.name ? `${hoverInfo.name} ` : ""}
                  </div>
                )}
              </div>
              <div>x: {hoverInfo.x} y: {hoverInfo.y}</div>
            </div>
          )}
        </div>

        {/* Upload another image */}
        <button
          type="button"
          onClick={handleDownload}
          className="w-full text-sm text-gray-500 dark:text-gray-200 cursor-pointer bg-blue-100 dark:bg-blue-900 p-2 rounded-lg hover:bg-blue-200 hover:dark:bg-blue-700 transition"
        >
          Download
        </button>
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

        {/* Grid Toggle */}
        <div className="flex items-center space-x-3 mt-2">
          <button
            type="button"
            role="switch"
            aria-checked={showGrid}
            onClick={() => setShowGrid(!showGrid)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition
              ${showGrid ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition
                ${showGrid ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>

          <span className="text-sm text-gray-700 dark:text-gray-300">
            Show Pixel Grid (For canvas sizes ≤ 128x128)
          </span>
        </div>

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
                className="relative aspect-square h-8 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {/* Tier indicator dot */}
                <div
                  className={`absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full
                    ${color.tier === "free" 
                      ? "" 
                      : "bg-yellow-400 dark:bg-yellow-400"}`}
                  title={color.tier === "premium" ? "Premium Color" : undefined}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Used colors display */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
            Colors in image ({colorLimit > 0 ? colorLimit : usedColorsData.length})
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Sorted by pixel count
          </p>
          <div className="flex gap-1 items-center max-h-48 overflow-y-auto p-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
            {(colorLimit > 0 ? usedColorsData.slice(0, colorLimit) : usedColorsData).map((data) => (
              <div
                key={data.hex}
                className="relative aspect-square h-8 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: data.hex }}
                title={`${data.name} (${data.count} pixels)`}
              >
                {/* Tier indicator dot */}
                <div
                  className={`absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full
                    ${data.tier === "free" 
                      ? "" 
                      : "bg-yellow-400 dark:bg-yellow-400"}`}
                  title={data.tier === "premium" ? "Premium Color" : undefined}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Image color reductiob */}
        <div className="mt-4">
          <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
            <span>Reduce colors</span>
            <span className="tabular-nums">
             {colorLimit} / {usedColorsData.length} colors
            </span>
          </div>
          <input
            type="range"
            min={usedColorsData.length > 0 ? 1 : 0}
            max={usedColorsData.length}
            step={1}
            value={colorLimit}
            onChange={(e) => setColorLimit(Number(e.target.value))}
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

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0") )
      .join("")
  );
}
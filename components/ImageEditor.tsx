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

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Nearest neighbor scaling
      ctx.imageSmoothingEnabled = false;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      const scale = Math.min(
        canvas.width / image.width,
        canvas.height / image.height
      );

      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;

      // Draw the image scaled to fit the canvas
      ctx.drawImage(
        image,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      ctx.restore();
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
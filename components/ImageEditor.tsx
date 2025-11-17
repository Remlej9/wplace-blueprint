"use client";

import { useRef, useState } from "react";

type ImageEditorProps = {
  src: string;
  alt?: string;
};

export default function ImageEditor({ src, alt = "Edited Image" }: ImageEditorProps) {
  const [ scale, setScale ] = useState(128); 
  const [ custom, setCustom ] = useState(false); 

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Preview area */}
      <div className="relative w-full aspect-square rounded-2xl border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain transition-transform duration-150 ease-out"
        />
        {/* Canvas size display in bottom-right corner of image */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-lg">
          {scale} x {scale}
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
            value={custom ? "custom" : scale.toString()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "custom") {
                setCustom(true);
              } else {
                setCustom(false);
                setScale(Number(value));
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


        {/* Custom scale */}
        {custom && (
        <ControlRow
          label="Size"
          value={scale}
          min={50}
          max={200}
          step={1}
          onChange={setScale}
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
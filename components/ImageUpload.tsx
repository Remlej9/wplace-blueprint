// ImageUpload.tsx

"use client";

import { useRef, useState } from "react";
import ImageEditor from "./ImageEditor";

export default function ImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(true);
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) {
          handleFile(file);
      }
  }

  // Handle the selected file, e.g., generate a preview URL
  const handleFile = (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      console.log("Selected file:", file);
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-5xl mx-auto">
      { /* Image upload input is hidden */ }
      <input
          type="file" accept="image/*" className="hidden"
          onChange={handleFileChange}
          ref={fileInputRef}
      />

      { /* Styled upload box */ }
      { !preview &&
          <div
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-1/2 h-48 outline-2 outline-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition 
            ${isDragging ? "outline-blue-400 bg-blue-50 dark:bg-gray-700" : "hover:outline-blue-400 hover:bg-blue-50 hover:dark:bg-gray-700"}
          `}>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click or drag & drop an image here
            </p>
          </div>
      }

      {preview && <ImageEditor src={preview} alt="Preview" onUploadClick={handleClick} />}
    </div>
  )
}

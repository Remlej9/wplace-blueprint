import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col gap-10 items-center justify-center bg-white dark:bg-gray-800 p-4">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">WPlace Blueprint</h1>
      <ImageUpload />
    </main>
  );
}

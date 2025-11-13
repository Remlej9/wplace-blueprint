import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800 p-4">
      <ImageUpload />
    </main>
  );
}

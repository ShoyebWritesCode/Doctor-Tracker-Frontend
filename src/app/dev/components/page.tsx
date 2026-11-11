import { notFound } from "next/navigation";
import { ComponentGallery } from "@/app/dev/components/component-gallery";

export const metadata = { title: "Component gallery" };

export default function ComponentGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ComponentGallery />;
}

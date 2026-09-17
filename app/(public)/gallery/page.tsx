import { ScrollReveal } from "@/components/public/scroll-reveal";
import { getPublicGalleryList } from "@/lib/actions/gallery";
import { PublicGalleryClient } from "@/components/public/public-gallery-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Gallery | MALHAR - The Cultural Society of Mirai",
  description: "Photos from our events, showcases, and cultural moments at Mirai.",
};

export default async function GalleryPage() {
  const media = await getPublicGalleryList();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <ScrollReveal variant="reveal" className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-100">
          Our{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
            Gallery
          </span>
        </h1>
        <p className="text-sm text-neutral-400">
          Photos from our events, showcases, and cultural moments at Mirai.
        </p>
      </ScrollReveal>

      {/* Content */}
      <PublicGalleryClient initialMedia={media} />
    </div>
  );
}

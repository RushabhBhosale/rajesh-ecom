"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Maximize2, Package } from "lucide-react";
import "yet-another-react-lightbox/styles.css";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), { ssr: false });

interface ProductMediaGalleryProps {
  name: string;
  primaryImage: string | null;
  galleryImages: string[];
}

export function ProductMediaGallery({
  name,
  primaryImage,
  galleryImages,
}: ProductMediaGalleryProps) {
  const media = useMemo(() => {
    const all = [primaryImage, ...galleryImages].filter((url): url is string => Boolean(url && url.trim()));
    const unique: string[] = [];
    all.forEach((url) => {
      if (!unique.includes(url)) {
        unique.push(url);
      }
    });
    return unique.slice(0, 12);
  }, [galleryImages, primaryImage]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveIndex((prev) => (media[prev] ? prev : 0));
  }, [media]);

  const activeImage = media[activeIndex] ?? null;
  const slides = useMemo(() => media.map((src) => ({ src })), [media]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-inner">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={name}
            width={1200}
            height={400}
            className="h-[350px] w-full object-cover"
            priority
          />
        ) : (
          <div className="flex min-h-[360px] items-center justify-center gap-3 text-slate-500">
            <Package className="h-10 w-10" />
            <span className="text-sm font-medium">Add gallery images to showcase this device</span>
          </div>
        )}
        {activeImage && media.length ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-slate-700 shadow-sm transition hover:bg-white"
            aria-label="View image in fullscreen"
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {media.length > 1 ? (
        <div className="flex flex-wrap gap-3">
          {media.slice(0, 3).map((url, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 w-20 overflow-hidden rounded-xl border transition-all ${
                  isActive
                    ? "border-primary ring-2 ring-primary/50"
                    : "border-slate-200 hover:border-primary/60"
                }`}
                aria-label={`View alternate image for ${name}`}
              >
                <Image src={url} alt={name} fill className="object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}

      {slides.length ? (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={activeIndex}
          slides={slides}
          on={{ view: ({ index }) => setActiveIndex(index) }}
        />
      ) : null}
    </div>
  );
}

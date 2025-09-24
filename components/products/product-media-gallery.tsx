"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";

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

  const [active, setActive] = useState<string | null>(media[0] ?? null);

  useEffect(() => {
    setActive((prev) => {
      if (prev && media.includes(prev)) {
        return prev;
      }
      return media[0] ?? null;
    });
  }, [media]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-inner">
        {active ? (
          <Image
            src={active}
            alt={name}
            width={1200}
            height={900}
            className="h-full w-full object-cover"
            priority
          />
        ) : (
          <div className="flex min-h-[360px] items-center justify-center gap-3 text-slate-500">
            <Package className="h-10 w-10" />
            <span className="text-sm font-medium">Add gallery images to showcase this device</span>
          </div>
        )}
      </div>

      {media.length > 1 ? (
        <div className="flex flex-wrap gap-3">
          {media.slice(0, 3).map((url) => {
            const isActive = url === active;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setActive(url)}
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
    </div>
  );
}

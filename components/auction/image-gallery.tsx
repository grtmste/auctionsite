"use client";

import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ImageOff, X, ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export interface GalleryImage {
  url: string;
  thumbUrl?: string | null;
  alt?: string | null;
}

export function ImageGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-border bg-surface text-muted">
        <ImageOff className="h-16 w-16" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Swiper
        modules={[FreeMode, Navigation, Thumbs]}
        navigation
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        className="overflow-hidden rounded-lg border border-border bg-header [--swiper-navigation-color:#fff] [--swiper-navigation-size:28px]"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <button
              className="relative block aspect-[4/3] w-full cursor-zoom-in"
              onClick={() => setLightboxIndex(index)}
              aria-label={`${title} ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt ?? `${title} ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                priority={index === 0}
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      {images.length > 1 && (
        <Swiper
          modules={[FreeMode, Navigation, Thumbs]}
          onSwiper={setThumbsSwiper}
          spaceBetween={8}
          slidesPerView={5}
          freeMode
          watchSlidesProgress
          className="gallery-thumbs"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative aspect-[4/3]">
                <Image
                  src={image.thumbUrl ?? image.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-4 top-4 z-10 text-white/80 hover:text-white cursor-pointer"
            aria-label="Sulge"
          >
            <X className="h-8 w-8" />
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 z-10 text-white/80 hover:text-white cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              aria-label="Eelmine"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}
          {lightboxIndex < images.length - 1 && (
            <button
              className="absolute right-4 z-10 text-white/80 hover:text-white cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              aria-label="Järgmine"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}
          <div className="relative h-full max-h-[85vh] w-full max-w-5xl">
            <Image
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt ?? title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

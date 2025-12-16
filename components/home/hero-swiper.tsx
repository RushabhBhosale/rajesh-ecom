"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import {
  ShieldCheck,
  Wrench,
  Truck,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "../ui/button";

type Slide = {
  name: string;
  title: string;
  description: string;
  bullets: string[];
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  cta: string;
};

export function HeroSwiper() {
  return (
    <div className="bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
      <Swiper
        // modules={[Autoplay]}
        slidesPerView={1}
        spaceBetween={24}
        speed={700}
        loop
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        className="w-full"
      >
        <SwiperSlide>
          <div className="p-6 sm:p-7 min-h-[400px] slide slide-1 flex items-center xl:pl-44">
            <div className="flex flex-col">
              <div className="text-white font-medium text-[clamp(2rem,4vw,3.75rem)]">
                Buy Refurbished <br /> Laptop Today
              </div>
              <div className="mt-10">
                <Button
                  variant="secondary"
                  className="font-bold rounded-none w-36 h-10"
                >
                  Shop now
                </Button>
              </div>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="p-6 sm:p-7 min-h-[400px] slide slide-2 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="text-white font-bold text-[clamp(2.25rem,4vw,3.75rem)] text-shadow-medium">
                Get the best Gaming Laptops
              </div>
              <div className="mt-10">
                <Button
                  variant="secondary"
                  className="font-bold rounded-none w-36 h-10"
                >
                  Shop now
                </Button>
              </div>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="p-6 sm:p-7 min-h-[400px] slide slide-3 flex items-center xl:pl-44">
            <div className="flex flex-col">
              <div className="text-black font-medium text-[clamp(1.4rem,4vw,3.75rem)] text-shadow-crisp">
                Premium laptops
                <br /> Smarter prices
              </div>
              <div className="mt-10">
                <Button
                  variant="secondary"
                  className="font-bold text-white bg-black rounded-none w-36 h-10"
                >
                  Shop now
                </Button>
              </div>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}

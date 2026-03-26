"use client";
import React from "react";
import { HandHeartIcon } from "lucide-react";
import Link from "next/link";
import { LAYANANS } from "@/data/layanan";
import dynamic from "next/dynamic";

const HeroIllustration = dynamic(
  () => import("@/components/lotties/hero").then((obj) => obj.HeroIllustration),
  {
    ssr: false,
  }
);

export default function Page() {
  return (
    <div className="w-11/12 md:w-10/12 m-auto my-8 space-y-16">
      <div className="space-y-2 flex flex-col-reverse md:flex-row text-center md:text-left items-center justify-center md:justify-between ">
        <div className="w-full md:w-1/2 space-y-8 md:space-y-10">
          <div className="space-y-2">
            <h2 className="text-base md:text-lg md:text-xl">
              Selamat datang di
            </h2>
            <h1 className="text-lg md:text-2xl md:text-3xl font-bold leading-normal md:leading-relaxed text-blue-950">
              Pelayanan Statistik Terpadu <br />
              BPS Kabupaten Tanjung Jabung Barat
            </h1>
          </div>

          <Link
            className="px-4 md:px-6 py-1 md:py-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 text-white w-fit m-auto md:m-0 flex items-center shadow-xl shadow-cyan-200 font-medium self-center text-base md:text-xl hover:scale-105 transition duration-300 ease-in-out cursor-pointer"
            href="#layanan"
          >
            <HandHeartIcon className="inline mr-4" />
            Layanan Kami
          </Link>
        </div>
        <HeroIllustration />
      </div>
      <div className="mt-8 space-y-8" id="layanan">
        <h2 className="text-xl md:text-4xl font-semibold text-center">
          Layanan Kami
        </h2>
        <div className="flex grid grid-cols-1 md:grid-cols-2 mt-4 gap-2">
          {LAYANANS.map((layanan) => (
            <Link
              key={layanan.title}
              href={layanan.href}
              className=" h-full p-4 md:p-8 border border-dashed hover:border-sky-600 flex items-center justify-center space-y-4 cursor-pointer"
            >
              <div className="w-24 h-24 md:w-48 md:h-48">{layanan.icon}</div>
              <div className=" flex flex-col items-start justify-between md:justify-center space-y-4">
                <h2 className="text-base md:text-xl font-medium">
                  {layanan.title}
                </h2>
                <div className="text-xs md:text-sm">{layanan.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

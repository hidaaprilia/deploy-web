"use client";
import dynamic from "next/dynamic";
// import { NotFoundIllustration } from "@/components/lotties/hero";
import Link from "next/link";
import React from "react";

const NotFoundIllustration = dynamic(
  () =>
    import("@/components/lotties/hero").then((obj) => obj.NotFoundIllustration),
  {
    ssr: false,
  }
);
const NotFound = () => {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <NotFoundIllustration lottieWidth={600} />
      <Link href="/" className="underline">
        Beranda
      </Link>
    </div>
  );
};

export default NotFound;

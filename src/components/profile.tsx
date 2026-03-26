"use client";
import React from "react";
import Image from "next/image";
import { useWidth } from "@/hooks/usewidth";
export const NavbarProfile = ({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) => {
  const { width } = useWidth();

  if (!user.name || !user.email || !user.image)
    return <div className="text-sm font-thin">Gagal mengambil info user</div>;
  if (width && width < 768)
    return (
      <div className="px-2 py-0.5 flex gap-2 items-center w-24">
        <Image
          src={user.image}
          width={24}
          height={24}
          alt={user.name}
          className="rounded-full"
        />
        <h2 className="text-xs font-thin truncate">{user.email}</h2>
      </div>
    );
  return (
    <div className="px-2 py-0.5 flex gap-2 items-center">
      <Image
        src={user.image}
        width={36}
        height={36}
        alt={user.name}
        className="rounded-full"
      />
      <div className="text-start">
        <h1 className="text-sm font-semibold truncate">{user.name}</h1>
        <h2 className="text-xs font-thin truncate">{user.email}</h2>
      </div>
    </div>
  );
};

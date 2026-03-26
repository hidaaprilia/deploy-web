"use server";
import { encrypt } from "@/lib/encryption";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { encryptState } from "@/app/action"
import React, { Suspense, useEffect } from "react";

const stateUrl = await encrpytState(stateString);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") {
      const message = "Silahkan login terlebih dahulu 😁";
      const state = { message: message, redirect_url: pathname };
      const stateString = JSON.stringify(state);
      const stateUrl = encrypt(stateString);
      const url = `/auth/login?state=${stateUrl}`;
      router.replace(url);
    }
  }, [status]);

  return (
    <div>
      <Suspense>{children}</Suspense>
    </div>
  );
};

export default Layout;

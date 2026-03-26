"use client";
import { signIn, useSession } from "next-auth/react";
import { GoogleLogo } from "@/components/logo";
import { redirect, useSearchParams } from "next/navigation";
import { decrypt } from "@/lib/encryption";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LoginIllustration = dynamic(
  () =>
    import("@/components/lotties/hero").then((obj) => obj.LoginIllustration),
  {
    ssr: false,
  }
);

export default function Login() {
  const { status } = useSession();
  const [message, setMessage] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string>("/");
  const searchParams = useSearchParams();
  const state = searchParams.get("state");

  useEffect(() => {
    if (state) {
      try {
        const decrypted = decrypt(state);
        const { message, redirect_url: callback_url } = JSON.parse(decrypted);
        if (message && status === "unauthenticated") {
          setMessage(message);
        }
        if (callback_url) {
          setCallbackUrl(callback_url);
        }
      } catch (e) {
        console.log(e);
        redirect("/auth/login");
        // redirect(pathname);
      }
    }
  }, [state]);

  return (
    <div className="flex flex-col flex-col-reverse md:flex-row w-full md:h-[80vh] md:divide-y-0 md:divide-x space-y-8 md:space-y-0 my-8 md:my-0">
      <div className="w-full md:h-full flex flex-col items-center justify-center space-y-4 md:space-y-8 p-8 hidden md:flex md:flex-col">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-sky-800">
          {" "}
          Pelayanan Statistik Terpadu
        </h1>

        <p className="text-sm md:text-lg">BPS Kabupaten Tanjung Jabung Barat</p>
      </div>
      <div className="w-full flex flex-col items-center justify-start md:justify-center space-y-8">
        <div className="h-[250] w-[250]">
          <LoginIllustration lottieWidth={250} />
        </div>
        <h1 className="font-semibold text-2xl">Sign In</h1>
        <div className="w-64 md:w-96 bg-white space-y-6 flex flex-col items-start justify-center">
          {message && (
            <div className="bg-red-50 px-4 py-2 text-start text-red-500 rounded-lg text-center text-sm w-96">
              {message}
            </div>
          )}
          <button
            onClick={() => signIn("google", { callbackUrl: callbackUrl })}
            className="px-4 py-2 rounded-lg border text-gray text-center flex items-center justify-center gap-2 w-full hover:bg-gray-100"
          >
            <div className="flex items-center gap-4">
              <GoogleLogo />
              Google
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

export const LogoBig = () => {
  <Image
    src={"/assets/images/logo-bps.webp"}
    height={56}
    width={56}
    alt="logo-bps"
  />;
};

export const LogoWithTitleBig = () => {
  return (
    <div className="flex space-x-4 items-center">
      <Image
        src={"/assets/images/logo-bps.webp"}
        height={48}
        width={56}
        alt="logo-bps"
      />
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold italic">
          Pelayanan Statistik Terpadu
        </h1>
        <p className="text-sm italic">BPS Kabupaten Tanjung Jabung Barat</p>
      </div>
    </div>
  );
};

export default function Logo() {
  return (
    <Link className="flex space-x-4 items-center" href="/">
      <Image
        src={"/assets/images/logo-bps.webp"}
        height={56}
        width={48}
        alt="logo-bps"
      />
      <div className="flex flex-col">
        <h1 className="text-sm md:text-xl font-bold italic">
          Pelayanan Statistik Terpadu
        </h1>
        <p className="text-xs italic">BPS Kabupaten Tanjung Jabung Barat</p>
      </div>
    </Link>
  );
}

export const GoogleLogo = () => {
  return (
    <Image
      src="/assets/images/logo-google.png"
      alt="google_logo"
      height={24}
      width={24}
    />
  );
};
export const LogoNavbar = () => {};

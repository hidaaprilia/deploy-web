import { useEffect, useState } from "react";

export const useWidth = () => {
  const [width, setwidth] = useState<number | null>(null);
  const [height, setheight] = useState<number | null>(null);

  useEffect(() => {
    if (window) {
      setwidth(window.innerWidth);
      setheight(window.innerHeight);
    }
  });
  return { width, height };
};

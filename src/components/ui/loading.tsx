import React from "react";
import { LoaderCircleIcon } from "lucide-react";

export const Spinner = () => {
  return (
    <LoaderCircleIcon
      className="animate-spin h-5 w-5 mr-3"
      viewBox="0 0 24 24"
    />
  );
};

export default Spinner;

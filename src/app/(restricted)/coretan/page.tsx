"use client";
import React, { useState } from "react";
import { encrypt, decrypt } from "@/lib/encryption";
const BukuTamu = () => {
  const [text, setText] = useState("Hello");
  const [encrypted, setEncrypted] = useState("");
  const [decrypted, setDecrypted] = useState("");
  return (
    <div>
      Buku Tamu
      <div className="flex flex-col gap-2 items-start">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border p-2"
        />
        <button
          onClick={() => setEncrypted(encrypt(text))}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white"
        >
          enkripsi
        </button>
        <button
          onClick={() => setDecrypted(decrypt(text))}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white"
        >
          dekripsi
        </button>
      </div>
      <div>encrypted text :{encrypted}</div>
      <div>decrypted text : {decrypted}</div>
    </div>
  );
};

export default BukuTamu;

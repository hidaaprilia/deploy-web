// var crypto = require('crypto');
import crypto from "crypto";
import "dotenv/config";

const algorithm = "aes256"; // or any other algorithm supported by OpenSSL
const key = process.env.ENCRYPTON_KEY
  ? process.env.ENCRYPTON_KEY
  : "encrypt-decrypt";

export const encrypt = (text: string) => {
  const cipher = crypto.createCipher(algorithm, key);

  const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
  return encrypted;
};
export const decrypt = (text: string) => {
  const decipher = crypto.createDecipher(algorithm, key);
  const decrypted =
    decipher.update(text, "hex", "utf8") + decipher.final("utf8");
  return decrypted;
};

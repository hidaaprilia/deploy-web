import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// const caString = fs
//   .readFileSync("./src/lib/supabase/certificates/prod-ca-2021.crt")
//   .toString();
// URL encode the certificate
// const caStringEncoded = encodeURIComponent(caString);
const dbUrl = new URL(process.env.DATABASE_URL! as string);
// dbUrl.searchParams.append("sslmode", "require");
// dbUrl.searchParams.append("sslrootcert", caStringEncoded);
export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl.toString(),
    // url: process.env.DATABASE_URL!,
    // ssl: "require",
    // ssl: {
    //   rejectUnauthorized: false,
    //   ca: caString,
    // },
  },
});

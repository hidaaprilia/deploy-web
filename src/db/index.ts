import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// const caString = fs
//   .readFileSync("./src/lib/supabase/certificates/prod-ca-2021.crt")
//   .toString();
// URL encode the certificate
// const caStringEncoded = encodeURIComponent(caString);
const dbUrl = new URL(process.env.DATABASE_URL! as string);
dbUrl.searchParams.append("sslmode", "require");
// dbUrl.searchParams.append("sslrootcert", caStringEncoded);

const client = postgres(dbUrl.toString(), {
  prepare: false,
  // ssl: {
  //   rejectUnauthorized: true,
  //   // Apply SSL certificate
  //   ca: fs
  //     .readFileSync("./src/lib/supabase/certificates/prod-ca-2021.crt")
  //     .toString(),
  // },
});
export const db = drizzle(client);

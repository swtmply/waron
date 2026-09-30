import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

// A clinic gets one URL and one database. Resolve this from an authenticated clinic later.
const client = createClient({
  url: process.env.CLINIC_DB_URL ?? "file:./data/clinic-demo.db",
  authToken: process.env.CLINIC_DB_AUTH_TOKEN,
})

export const db = drizzle({ client })

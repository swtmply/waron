import { mkdirSync } from "node:fs"
import { migrate } from "drizzle-orm/libsql/migrator"
import { db } from "./client.server"

mkdirSync("data", { recursive: true })
await migrate(db, { migrationsFolder: "./drizzle" })
console.log("Clinic migrations applied")

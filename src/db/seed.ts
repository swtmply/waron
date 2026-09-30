import { mkdirSync } from "node:fs"
import { db } from "./client.server"
import { appointments, clinicalNotes, patients, practitioners } from "./schema"

if (
  process.env.CLINIC_DB_URL &&
  !process.env.CLINIC_DB_URL.startsWith("file:")
) {
  throw new Error("Demo seed is only for a local SQLite file")
}
mkdirSync("data", { recursive: true })

const existing = await db
  .select({ id: practitioners.id })
  .from(practitioners)
  .limit(1)
if (existing.length) {
  console.log("Clinic already has data; seed skipped")
  process.exit(0)
}

const staff = [
  {
    id: crypto.randomUUID(),
    name: "Dr. Maya Santos",
    title: "General dentist",
    color: "teal",
  },
  {
    id: crypto.randomUUID(),
    name: "Dr. Liam Cruz",
    title: "Orthodontist",
    color: "blue",
  },
  {
    id: crypto.randomUUID(),
    name: "Dr. Sofia Reyes",
    title: "Dental surgeon",
    color: "violet",
  },
]
const people = [
  {
    id: crypto.randomUUID(),
    name: "Alex Rivera",
    birthDate: "1992-05-14",
    phone: "+63 917 555 0101",
    email: "alex@example.com",
    medicalAlerts: "Penicillin allergy",
  },
  {
    id: crypto.randomUUID(),
    name: "Jordan Lee",
    birthDate: "1988-11-03",
    phone: "+63 917 555 0102",
    email: "jordan@example.com",
    medicalAlerts: null,
  },
  {
    id: crypto.randomUUID(),
    name: "Sam Garcia",
    birthDate: "2001-02-22",
    phone: "+63 917 555 0103",
    email: "sam@example.com",
    medicalAlerts: null,
  },
  {
    id: crypto.randomUUID(),
    name: "Casey Tan",
    birthDate: "1996-08-09",
    phone: "+63 917 555 0104",
    email: "casey@example.com",
    medicalAlerts: "Latex sensitivity",
  },
  {
    id: crypto.randomUUID(),
    name: "Taylor Mendoza",
    birthDate: "1979-12-18",
    phone: "+63 917 555 0105",
    email: "taylor@example.com",
    medicalAlerts: null,
  },
]
const now = new Date()
const monday = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - ((now.getDay() + 6) % 7)
)
function at(day: number, hour: number, minute = 0) {
  return new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + day,
    hour,
    minute
  ).toISOString()
}
const bookings = [
  {
    patientId: people[0].id,
    practitionerId: staff[0].id,
    startsAt: at(0, 9),
    durationMinutes: 60,
    reason: "Routine cleaning",
    status: "completed" as const,
  },
  {
    patientId: people[1].id,
    practitionerId: staff[1].id,
    startsAt: at(1, 10, 30),
    durationMinutes: 45,
    reason: "Braces adjustment",
    status: "scheduled" as const,
  },
  {
    patientId: people[2].id,
    practitionerId: staff[0].id,
    startsAt: at(2, 9, 30),
    durationMinutes: 60,
    reason: "Dental consultation",
    status: "scheduled" as const,
  },
  {
    patientId: people[3].id,
    practitionerId: staff[2].id,
    startsAt: at(2, 14),
    durationMinutes: 90,
    reason: "Wisdom tooth review",
    status: "scheduled" as const,
  },
  {
    patientId: people[4].id,
    practitionerId: staff[0].id,
    startsAt: at(3, 11),
    durationMinutes: 30,
    reason: "Follow-up",
    status: "scheduled" as const,
  },
  {
    patientId: people[0].id,
    practitionerId: staff[1].id,
    startsAt: at(4, 13, 30),
    durationMinutes: 45,
    reason: "Alignment consult",
    status: "scheduled" as const,
  },
]
await db.insert(practitioners).values(staff)
await db
  .insert(patients)
  .values(people.map((person) => ({ ...person, createdAt: now.toISOString() })))
await db
  .insert(appointments)
  .values(
    bookings.map((booking) => ({
      id: crypto.randomUUID(),
      ...booking,
      createdAt: now.toISOString(),
    }))
  )
await db.insert(clinicalNotes).values({
  id: crypto.randomUUID(),
  patientId: people[0].id,
  practitionerId: staff[0].id,
  note: "Routine examination and cleaning completed. No active decay observed. Review in six months.",
  createdAt: at(0, 10),
})
console.log("Seeded fictional clinic data")

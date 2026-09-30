import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const practitioners = sqliteTable("clinic_practitioners", {
  id: text().primaryKey(),
  name: text().notNull(),
  title: text().notNull(),
  color: text().notNull(),
})

export const patients = sqliteTable("clinic_patients", {
  id: text().primaryKey(),
  name: text().notNull(),
  birthDate: text(),
  phone: text(),
  email: text(),
  medicalAlerts: text(),
  createdAt: text().notNull(),
})

export const appointments = sqliteTable(
  "clinic_appointments",
  {
    id: text().primaryKey(),
    patientId: text()
      .notNull()
      .references(() => patients.id),
    practitionerId: text()
      .notNull()
      .references(() => practitioners.id),
    startsAt: text().notNull(),
    durationMinutes: integer().notNull(),
    reason: text().notNull(),
    status: text({ enum: ["scheduled", "completed", "cancelled"] })
      .notNull()
      .default("scheduled"),
    createdAt: text().notNull(),
  },
  (table) => [
    index("appointments_starts_at_idx").on(table.startsAt),
    index("appointments_practitioner_idx").on(table.practitionerId),
  ]
)

export const clinicalNotes = sqliteTable(
  "clinic_clinical_notes",
  {
    id: text().primaryKey(),
    patientId: text()
      .notNull()
      .references(() => patients.id),
    practitionerId: text()
      .notNull()
      .references(() => practitioners.id),
    appointmentId: text().references(() => appointments.id),
    note: text().notNull(),
    createdAt: text().notNull(),
  },
  (table) => [index("clinical_notes_patient_idx").on(table.patientId)]
)

export const treatmentPlans = sqliteTable(
  "clinic_treatment_plans",
  {
    id: text().primaryKey(),
    patientId: text()
      .notNull()
      .references(() => patients.id),
    practitionerId: text()
      .notNull()
      .references(() => practitioners.id),
    procedure: text().notNull(),
    totalCents: integer().notNull(),
    createdAt: text().notNull(),
  },
  (table) => [
    index("treatment_plans_patient_idx").on(table.patientId),
    index("treatment_plans_practitioner_idx").on(table.practitionerId),
  ]
)

export const installmentPayments = sqliteTable(
  "clinic_installment_payments",
  {
    id: text().primaryKey(),
    planId: text()
      .notNull()
      .references(() => treatmentPlans.id),
    amountCents: integer().notNull(),
    paidOn: text().notNull(),
    createdAt: text().notNull(),
  },
  (table) => [index("installment_payments_plan_idx").on(table.planId)]
)

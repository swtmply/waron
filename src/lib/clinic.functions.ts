import { createServerFn } from "@tanstack/react-start"
import { notFound } from "@tanstack/react-router"
import { z } from "zod"
import { and, eq, or } from "drizzle-orm"
import { db } from "@/db/client.server"
import {
  appointments,
  clinicalNotes,
  installmentPayments,
  patients,
  practitioners,
  treatmentPlans,
} from "@/db/schema"

const requiredText = z.string().trim().min(1)
const pesoAmount = z
  .string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, "Enter a valid peso amount")
  .refine((value) => Number(value) > 0 && Number(value) <= 10_000_000, {
    message: "Amount must be between ₱0.01 and ₱10,000,000",
  })
const appointmentInput = z.object({
  patientId: z.uuid(),
  practitionerId: z.uuid(),
  startsAt: z.iso.datetime(),
  durationMinutes: z.number().int().min(15).max(240),
  reason: requiredText,
})

export const getClinicData = createServerFn({ method: "GET" }).handler(
  async () => {
    const [
      patientRows,
      practitionerRows,
      appointmentRows,
      noteRows,
      planRows,
      paymentRows,
    ] = await Promise.all([
      db.select().from(patients),
      db.select().from(practitioners),
      db.select().from(appointments),
      db.select().from(clinicalNotes),
      db.select().from(treatmentPlans),
      db.select().from(installmentPayments),
    ])
    return {
      patients: patientRows,
      practitioners: practitionerRows,
      appointments: appointmentRows,
      notes: noteRows,
      treatmentPlans: planRows,
      installmentPayments: paymentRows,
    }
  }
)

export const getAppointmentDetail = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const matches = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, data.id))
    if (matches.length === 0) throw notFound()
    const appointment = matches[0]
    const [patientRows, practitionerRows] = await Promise.all([
      db.select().from(patients).where(eq(patients.id, appointment.patientId)),
      db
        .select()
        .from(practitioners)
        .where(eq(practitioners.id, appointment.practitionerId)),
    ])
    if (patientRows.length === 0 || practitionerRows.length === 0)
      throw notFound()
    return {
      appointment,
      patient: patientRows[0],
      practitioner: practitionerRows[0],
    }
  })

export const createPatient = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: requiredText,
      birthDate: z.iso.date().or(z.literal("")).optional(),
      phone: z.string().optional(),
      email: z.email().or(z.literal("")).optional(),
      medicalAlerts: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    await db.insert(patients).values({
      id: crypto.randomUUID(),
      name: data.name,
      birthDate: data.birthDate || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      medicalAlerts: data.medicalAlerts?.trim() || null,
      createdAt: new Date().toISOString(),
    })
  })

export const updatePatient = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.uuid(),
      name: requiredText,
      birthDate: z.iso.date().or(z.literal("")).optional(),
      phone: z.string().optional(),
      email: z.email().or(z.literal("")).optional(),
      medicalAlerts: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { id, ...details } = data
    await db
      .update(patients)
      .set({
        name: details.name,
        birthDate: details.birthDate || null,
        phone: details.phone?.trim() || null,
        email: details.email?.trim() || null,
        medicalAlerts: details.medicalAlerts?.trim() || null,
      })
      .where(eq(patients.id, id))
  })

export const deletePatient = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      const plans = await tx
        .select({ id: treatmentPlans.id })
        .from(treatmentPlans)
        .where(eq(treatmentPlans.patientId, data.id))
      for (const plan of plans) {
        await tx
          .delete(installmentPayments)
          .where(eq(installmentPayments.planId, plan.id))
      }
      await tx
        .delete(treatmentPlans)
        .where(eq(treatmentPlans.patientId, data.id))
      await tx.delete(clinicalNotes).where(eq(clinicalNotes.patientId, data.id))
      await tx.delete(appointments).where(eq(appointments.patientId, data.id))
      await tx.delete(patients).where(eq(patients.id, data.id))
    })
  })

export const createTreatmentPlan = createServerFn({ method: "POST" })
  .validator(
    z.object({
      patientId: z.uuid(),
      practitionerId: z.uuid(),
      procedure: requiredText,
      total: pesoAmount,
    })
  )
  .handler(async ({ data }) => {
    await db.insert(treatmentPlans).values({
      id: crypto.randomUUID(),
      patientId: data.patientId,
      practitionerId: data.practitionerId,
      procedure: data.procedure,
      totalCents: Math.round(Number(data.total) * 100),
      createdAt: new Date().toISOString(),
    })
  })

export const addInstallmentPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      planId: z.uuid(),
      amount: pesoAmount,
      paidOn: z.iso.date(),
    })
  )
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      const plans = await tx
        .select()
        .from(treatmentPlans)
        .where(eq(treatmentPlans.id, data.planId))
      if (plans.length === 0) throw new Error("Treatment plan not found")
      const plan = plans[0]
      const payments = await tx
        .select({ amountCents: installmentPayments.amountCents })
        .from(installmentPayments)
        .where(eq(installmentPayments.planId, data.planId))
      const paidCents = payments.reduce(
        (sum, payment) => sum + payment.amountCents,
        0
      )
      const amountCents = Math.round(Number(data.amount) * 100)
      if (amountCents > plan.totalCents - paidCents)
        throw new Error("Payment exceeds the remaining balance")
      await tx.insert(installmentPayments).values({
        id: crypto.randomUUID(),
        planId: data.planId,
        amountCents,
        paidOn: data.paidOn,
        createdAt: new Date().toISOString(),
      })
    })
  })

export const createPractitioner = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: requiredText,
      title: requiredText,
      color: z.enum(["teal", "blue", "violet", "amber"]),
    })
  )
  .handler(async ({ data }) => {
    await db.insert(practitioners).values({ id: crypto.randomUUID(), ...data })
  })

async function ensureAvailable(
  patientId: string,
  practitionerId: string,
  startsAt: string,
  durationMinutes: number,
  excludeId?: string
) {
  const start = new Date(startsAt).getTime()
  const end = start + durationMinutes * 60_000
  if (!Number.isFinite(end)) throw new Error("Invalid appointment time")
  // ponytail: scan this clinic's scheduled appointments; use a transaction or database constraint if concurrent booking grows.
  const existing = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.status, "scheduled"),
        or(
          eq(appointments.practitionerId, practitionerId),
          eq(appointments.patientId, patientId)
        )
      )
    )
  if (
    existing.some(
      (item) =>
        item.id !== excludeId &&
        start <
          new Date(item.startsAt).getTime() + item.durationMinutes * 60_000 &&
        end > new Date(item.startsAt).getTime()
    )
  ) {
    throw new Error(
      "The patient or practitioner already has an appointment at that time"
    )
  }
}

export const createAppointment = createServerFn({ method: "POST" })
  .validator(appointmentInput)
  .handler(async ({ data }) => {
    await ensureAvailable(
      data.patientId,
      data.practitionerId,
      data.startsAt,
      data.durationMinutes
    )
    await db.insert(appointments).values({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
    })
  })

export const updateAppointment = createServerFn({ method: "POST" })
  .validator(appointmentInput.extend({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const matches = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, data.id))
    if (matches.length === 0) throw new Error("Appointment not found")
    if (matches[0].status === "scheduled") {
      await ensureAvailable(
        data.patientId,
        data.practitionerId,
        data.startsAt,
        data.durationMinutes,
        data.id
      )
    }
    await db
      .update(appointments)
      .set({
        patientId: data.patientId,
        practitionerId: data.practitionerId,
        startsAt: data.startsAt,
        durationMinutes: data.durationMinutes,
        reason: data.reason,
      })
      .where(eq(appointments.id, data.id))
  })

export const deleteAppointment = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      await tx
        .update(clinicalNotes)
        .set({ appointmentId: null })
        .where(eq(clinicalNotes.appointmentId, data.id))
      await tx.delete(appointments).where(eq(appointments.id, data.id))
    })
  })

export const setAppointmentStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.uuid(),
      status: z.enum(["scheduled", "completed", "cancelled"]),
    })
  )
  .handler(async ({ data }) => {
    if (data.status === "scheduled") {
      const matches = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, data.id))
      if (matches.length === 0) throw new Error("Appointment not found")
      const appointment = matches[0]
      await ensureAvailable(
        appointment.patientId,
        appointment.practitionerId,
        appointment.startsAt,
        appointment.durationMinutes,
        appointment.id
      )
    }
    await db
      .update(appointments)
      .set({ status: data.status })
      .where(eq(appointments.id, data.id))
  })

export const addClinicalNote = createServerFn({ method: "POST" })
  .validator(
    z.object({
      patientId: z.uuid(),
      practitionerId: z.uuid(),
      note: requiredText,
    })
  )
  .handler(async ({ data }) => {
    await db.insert(clinicalNotes).values({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
    })
  })

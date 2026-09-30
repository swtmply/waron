import { useActionState } from "react"
import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { DentalToothIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { addClinicalNote, getClinicData } from "@/lib/clinic.functions"

export const Route = createFileRoute("/patients/$patientId")({
  loader: async ({ params }) => {
    const data = await getClinicData()
    const patient = data.patients.find((item) => item.id === params.patientId)
    if (!patient) throw notFound()
    return { data, patient }
  },
  component: PatientPage,
})

const format = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-PH", options).format(new Date(value))

function PatientPage() {
  const { data, patient } = Route.useLoaderData()
  const router = useRouter()
  const [error, addNoteAction, saving] = useActionState(
    async (_previousError: string, fields: FormData) => {
      try {
        await addClinicalNote({
          data: {
            patientId: patient.id,
            practitionerId: String(fields.get("practitionerId") ?? ""),
            note: String(fields.get("note") ?? ""),
          },
        })
        await router.invalidate()
        return ""
      } catch (cause) {
        return cause instanceof Error ? cause.message : "Could not save note"
      }
    },
    ""
  )
  const notes = data.notes
    .filter((item) => item.patientId === patient.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const visits = data.appointments
    .filter((item) => item.patientId === patient.id)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
  const visitGroups = ["scheduled", "completed", "cancelled"].map((status) => ({
    status,
    visits: visits.filter((visit) => visit.status === status),
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HugeiconsIcon icon={DentalToothIcon} className="size-5" />
            </span>
            Clarity
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 md:px-8 md:py-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">
            Clinic workspace
          </Link>
          <span>/</span>
          <Link to="/patients" className="hover:text-foreground">
            Patients
          </Link>
          <span>/</span>
          <span className="text-foreground">{patient.name}</span>
        </nav>
        <h1 className="font-heading text-2xl tracking-tight">{patient.name}</h1>
        <Link
          to="/installments"
          search={{ patientId: patient.id }}
          className="text-sm font-medium text-primary hover:underline"
        >
          View treatment plans and installments
        </Link>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Visit history</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {visits.length ? (
                  visitGroups.map(
                    ({ status, visits: statusVisits }) =>
                      statusVisits.length > 0 && (
                        <section key={status} className="flex flex-col gap-1">
                          <h3 className="text-xs font-medium text-muted-foreground capitalize">
                            {status} visits
                          </h3>
                          {statusVisits.map((visit) => (
                            <Link
                              key={visit.id}
                              to="/appointments/$appointmentId"
                              params={{ appointmentId: visit.id }}
                              className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0 hover:text-primary focus-visible:outline-ring"
                            >
                              <span>
                                <span className="block text-sm font-medium">
                                  {visit.reason}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(visit.startsAt, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </span>
                              <Badge variant="outline" className="capitalize">
                                {visit.status}
                              </Badge>
                            </Link>
                          ))}
                        </section>
                      )
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No visits yet.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Clinical notes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {notes.length ? (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="border-b pb-3 text-sm last:border-b-0"
                    >
                      <p>{note.note}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {
                          data.practitioners.find(
                            (item) => item.id === note.practitionerId
                          )?.name
                        }{" "}
                        ·{" "}
                        {format(note.createdAt, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No clinical notes yet.
                  </p>
                )}
                <form
                  action={addNoteAction}
                  className="flex flex-col gap-3 border-t pt-4"
                >
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Practitioner
                    <select
                      name="practitionerId"
                      required
                      defaultValue=""
                      className="form-select"
                    >
                      <option value="" disabled>
                        Select a practitioner
                      </option>
                      {data.practitioners.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Add clinical note
                    <Textarea
                      name="note"
                      required
                      rows={3}
                      placeholder="Findings, care provided, or follow-up advice"
                    />
                  </label>
                  {error && (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save note"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <Card size="sm" className="self-start">
            <CardHeader>
              <CardTitle>Patient information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Date of birth</p>
                <p>
                  {patient.birthDate
                    ? format(`${patient.birthDate}T12:00:00`, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p>{patient.phone || "Not recorded"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{patient.email || "Not recorded"}</p>
              </div>
              {patient.medicalAlerts && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <strong>Medical alert:</strong> {patient.medicalAlerts}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

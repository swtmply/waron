import { createFileRoute, Link } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  DentalToothIcon,
  PatientIcon,
  StethoscopeIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAppointmentDetail } from "@/lib/clinic.functions"

export const Route = createFileRoute("/appointments/$appointmentId")({
  loader: ({ params }) =>
    getAppointmentDetail({ data: { id: params.appointmentId } }),
  component: AppointmentPage,
})

const format = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-PH", options).format(new Date(value))

function AppointmentPage() {
  const { appointment, patient, practitioner } = Route.useLoaderData()

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
      <main className="mx-auto flex max-w-6xl flex-col gap-7 px-5 py-8 md:px-8 md:py-12">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">
            Clinic workspace
          </Link>
          <span>/</span>
          <Link to="/" className="hover:text-foreground">
            Appointments
          </Link>
          <span>/</span>
          <span className="text-foreground">{appointment.reason}</span>
        </nav>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Visit: {appointment.reason}</CardTitle>
                <Badge
                  variant={
                    appointment.status === "scheduled"
                      ? "default"
                      : appointment.status === "completed"
                        ? "secondary"
                        : "outline"
                  }
                  className="capitalize"
                >
                  {appointment.status}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Detail
                  icon={Calendar03Icon}
                  label="Date"
                  value={format(appointment.startsAt, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <Detail
                  icon={Calendar03Icon}
                  label="Time"
                  value={`${format(appointment.startsAt, { hour: "numeric", minute: "2-digit" })} · ${appointment.durationMinutes} minutes`}
                />
                <Detail
                  icon={StethoscopeIcon}
                  label="Practitioner"
                  value={`${practitioner.name} · ${practitioner.title}`}
                />
                <Detail
                  icon={PatientIcon}
                  label="Patient"
                  value={patient.name}
                />
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient information</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Full name</p>
                  <p className="font-semibold">{patient.name}</p>
                </div>
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
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                    <strong>Medical alert:</strong> {patient.medicalAlerts}
                  </div>
                )}
                <Link
                  to="/patients/$patientId"
                  params={{ patientId: patient.id }}
                  className="font-medium text-primary hover:underline"
                >
                  View patient history
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: typeof Calendar03Icon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-lg bg-primary/10 p-2 text-primary">
        <HugeiconsIcon icon={icon} className="size-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

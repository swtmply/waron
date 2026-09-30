import { useActionState, useState } from "react"
import type { ReactNode } from "react"
import { Link, useNavigate, useRouter } from "@tanstack/react-router"
import { createColumnHelper } from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpDownIcon,
  Calendar03Icon,
  DashboardSquare02Icon,
  Doctor01Icon,
  PatientIcon,
  PlusSignIcon,
  SortingDownIcon,
  SortingUpIcon,
  StethoscopeIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty as EmptyState,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty"
import {
  Field as FormField,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useDashboardSearch } from "@/lib/dashboard-search"
import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ClinicTable } from "@/components/clinic-table"
import { InstallmentsView } from "@/components/installments-view"
import type { ClinicTableFeatures } from "@/components/clinic-table"
import type { getClinicData } from "@/lib/clinic.functions"
import {
  createAppointment,
  createPatient,
  createPractitioner,
  deleteAppointment,
  deletePatient,
  setAppointmentStatus,
  updateAppointment,
  updatePatient,
} from "@/lib/clinic.functions"

type ClinicData = Awaited<ReturnType<typeof getClinicData>>
type Patient = ClinicData["patients"][number]
type Appointment = ClinicData["appointments"][number]
type View = "overview" | "calendar" | "patients" | "team" | "installments"
type FormKind =
  | "appointment"
  | "editAppointment"
  | "patient"
  | "editPatient"
  | "practitioner"
  | null

const format = (value: string | Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-PH", options).format(new Date(value))
const time = (value: string) =>
  format(value, { hour: "numeric", minute: "2-digit" })
const dayKey = (value: string | Date) => {
  const d = new Date(value)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
const colors: Record<string, string> = {
  teal: "bg-secondary text-secondary-foreground border-primary/20",
  blue: "bg-blue-100 text-blue-900 border-blue-200",
  violet: "bg-violet-100 text-violet-900 border-violet-200",
  amber: "bg-amber-100 text-amber-900 border-amber-200",
}

function Initials({ name }: { name: string; color?: string }) {
  return (
    <Avatar size="sm">
      <AvatarFallback>
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
function Status({ status }: { status: Appointment["status"] }) {
  return (
    <Badge
      variant={
        status === "scheduled"
          ? "default"
          : status === "completed"
            ? "secondary"
            : "outline"
      }
      className="capitalize"
    >
      {status}
    </Badge>
  )
}
function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  return (
    <HugeiconsIcon
      icon={
        direction === "asc"
          ? SortingUpIcon
          : direction === "desc"
            ? SortingDownIcon
            : ArrowUpDownIcon
      }
      className="size-4"
      aria-hidden="true"
    />
  )
}
function Heading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  )
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <FormField>
      <FieldLabel className="flex flex-col items-start gap-1.5">
        {label}
        {children}
      </FieldLabel>
    </FormField>
  )
}

const viewTitles = {
  overview: "Dashboard",
  calendar: "Calendar",
  patients: "Patients",
  installments: "Treatments",
  team: "Practitioners",
}

function ClinicSidebar({ view }: { view: View }) {
  const { isMobile } = useSidebar()
  const navigation = [
    {
      view: "calendar",
      to: "/calendar",
      icon: Calendar03Icon,
      label: "Calendar",
    },
    { view: "patients", to: "/patients", icon: PatientIcon, label: "Patients" },
    {
      view: "installments",
      to: "/installments",
      icon: StethoscopeIcon,
      label: "Treatments",
    },
    { view: "team", to: "/team", icon: Doctor01Icon, label: "Practitioners" },
  ] as const
  return (
    <>
      <Sidebar id="clinic-sidebar">
        <SidebarHeader>
          <Link
            to="/"
            search={(previous) => ({ sidebar: previous.sidebar })}
            className="flex items-center gap-2 overflow-hidden p-2"
          >
            <img src="/icons/hospital.svg" alt="" className="shrink-0" />
            <span className="text-xl font-semibold tracking-tight group-data-[collapsible=icon]:sr-only">
              Kliniko
            </span>
          </Link>
          <div className="flex items-center gap-2 overflow-hidden rounded-2xl border bg-muted/10 p-2">
            <img src="/icons/tooth.svg" alt="" className="shrink-0" />
            <div className="min-w-0 group-data-[collapsible=icon]:sr-only">
              <p className="text-sm font-medium">Dentallen</p>
              <p className="text-xs text-muted-foreground">Dental Clinic</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Main navigation" className="flex flex-col gap-4">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={view === "overview"}
                    tooltip="Dashboard"
                    aria-label="Dashboard"
                    render={
                      <Link
                        to="/"
                        search={(previous) => ({
                          sidebar: isMobile ? "collapsed" : previous.sidebar,
                        })}
                        aria-current={view === "overview" ? "page" : undefined}
                      />
                    }
                  >
                    <HugeiconsIcon
                      icon={DashboardSquare02Icon}
                      aria-hidden="true"
                    />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>CLINIC</SidebarGroupLabel>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                      isActive={view === item.view}
                      tooltip={item.label}
                      aria-label={item.label}
                      render={
                        <Link
                          to={item.to}
                          search={(previous) => ({
                            sidebar: isMobile ? "collapsed" : previous.sidebar,
                          })}
                          aria-current={view === item.view ? "page" : undefined}
                        />
                      }
                    >
                      <HugeiconsIcon icon={item.icon} aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:sr-only">
              Toggle sidebar
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarTrigger className="fixed bottom-4 left-4 border bg-card shadow-sm md:hidden" />
    </>
  )
}

export function ClinicDashboard({
  data,
  view,
}: {
  data: ClinicData
  view: View
}) {
  const router = useRouter()
  const { search, updateSearch } = useDashboardSearch()
  const form =
    search.form === "treatmentPlan" || search.form === "payment"
      ? null
      : (search.form ?? null)
  const editingAppointmentId =
    form === "editAppointment" ? search.recordId : undefined
  const editingPatientId = form === "editPatient" ? search.recordId : undefined
  const today = new Date()
  const todayAppointments = data.appointments
    .filter(
      (item) =>
        dayKey(item.startsAt) === dayKey(today) && item.status !== "cancelled"
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const patientName = (id: string) =>
    data.patients.find((item) => item.id === id)?.name ?? "Unknown patient"
  const practitioner = (id: string) =>
    data.practitioners.find((item) => item.id === id)
  const visiblePractitioners = data.practitioners.filter((item) =>
    `${item.name} ${item.title}`
      .toLowerCase()
      .includes((search.q ?? "").toLowerCase())
  )

  function open(kind: FormKind) {
    updateSearch({ form: kind ?? undefined, recordId: undefined })
  }
  function setForm(kind: FormKind) {
    updateSearch({ form: kind ?? undefined, recordId: undefined })
  }
  function openEdit(id: string) {
    updateSearch({ form: "editAppointment", recordId: id })
  }
  function openPatientEdit(id: string) {
    updateSearch({ form: "editPatient", recordId: id })
  }
  async function save(request: Promise<unknown>): Promise<string> {
    try {
      await request
      await router.invalidate()
      setForm(null)
      return ""
    } catch (cause) {
      return cause instanceof Error
        ? cause.message
        : "Could not save. Please try again."
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        open={
          search.sidebar === undefined
            ? undefined
            : search.sidebar === "expanded"
        }
        onOpenChange={(isOpen) =>
          updateSearch({ sidebar: isOpen ? "expanded" : "collapsed" })
        }
        className="bg-neutral-300/10"
      >
        <ClinicSidebar view={view} />
        <main className="min-w-0 flex-1">
          <header className="flex min-h-19 items-center justify-between gap-4 border-b bg-card p-4">
            <h1 className="text-xl font-semibold tracking-tight">
              {viewTitles[view]}
            </h1>
            <InputGroup className="hidden max-w-140 flex-1 bg-muted/10 lg:flex">
              <InputGroupAddon>
                <img src="/icons/search.svg" alt="" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label="Search clinic"
                placeholder="Search anything here..."
                value={search.q ?? ""}
                onChange={(event) =>
                  updateSearch(
                    { q: event.target.value || undefined, page: undefined },
                    true
                  )
                }
              />
            </InputGroup>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="h-auto gap-2 p-0"
                    aria-label="Open administrator menu"
                  />
                }
              >
                <img src="/icons/user.svg" alt="" className="shrink-0" />
                <span className="hidden flex-col items-start sm:flex">
                  <span className="text-sm font-medium">
                    John Allen Delos Reyes
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Administrator
                  </span>
                </span>
                <img src="/icons/chevron.svg" alt="" className="-rotate-90" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => open("appointment")}>
                    New appointment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => open("patient")}>
                    Create patient
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <div className="mx-auto flex max-w-[1500px] flex-col gap-6 p-4 pt-7 pb-20 md:pb-6">
            {view === "overview" && (
              <>
                <Heading
                  title="Your clinic, at a glance"
                  action={
                    <Button onClick={() => open("appointment")}>
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        data-icon="inline-start"
                      />
                      New appointment
                    </Button>
                  }
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    [
                      "Appointments today",
                      todayAppointments.length,
                      "On today's schedule",
                    ],
                    [
                      "Upcoming",
                      data.appointments.filter(
                        (item) =>
                          item.status === "scheduled" &&
                          item.startsAt >= today.toISOString()
                      ).length,
                      "Scheduled from today",
                    ],
                    [
                      "Patients",
                      data.patients.length,
                      "Active patient records",
                    ],
                    [
                      "Practitioners",
                      data.practitioners.length,
                      "On your care team",
                    ],
                  ].map(([label, value, detail]) => (
                    <Card key={label} size="sm">
                      <CardHeader>
                        <CardDescription>{label}</CardDescription>
                        <CardTitle variant="metric">{value}</CardTitle>
                        <CardDescription>{detail}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-heading text-xl">Today's schedule</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link
                          to="/calendar"
                          search={(previous) => ({ sidebar: previous.sidebar })}
                        />
                      }
                    >
                      View calendar
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {todayAppointments.length ? (
                      todayAppointments.map((item) => (
                        <Link
                          key={item.id}
                          to="/appointments/$appointmentId"
                          params={{ appointmentId: item.id }}
                          search={(previous) => ({ sidebar: previous.sidebar })}
                          className="flex items-center gap-4 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50 focus-visible:outline-ring"
                        >
                          <span className="w-17 text-sm font-semibold">
                            {time(item.startsAt)}
                          </span>
                          <span className="h-10 w-1 rounded-full bg-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {patientName(item.patientId)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.reason} ·{" "}
                              {practitioner(item.practitionerId)?.name}
                            </p>
                          </div>
                          <Status status={item.status} />
                        </Link>
                      ))
                    ) : (
                      <Empty text="Nothing booked for today. Your schedule is clear." />
                    )}
                  </div>
                </div>
                <Heading title="All visits" />
                <AppointmentTable
                  data={data}
                  onEdit={openEdit}
                  onDelete={(id) => {
                    if (window.confirm("Delete this appointment?")) {
                      void save(deleteAppointment({ data: { id } }))
                    }
                  }}
                  onStatus={(id, status) =>
                    void save(setAppointmentStatus({ data: { id, status } }))
                  }
                />
              </>
            )}
            {view === "calendar" && (
              <CalendarView data={data} onNew={() => open("appointment")} />
            )}
            {view === "patients" && (
              <Tabs
                value={search.tab ?? "all"}
                onValueChange={(value) =>
                  updateSearch({
                    tab: value === "active" ? "active" : undefined,
                    page: undefined,
                  })
                }
                className="gap-4"
              >
                <TabsList
                  variant="line"
                  className="w-full justify-start border-b"
                >
                  <TabsTrigger value="all">All Patients</TabsTrigger>
                  <TabsTrigger value="active">Active Treatments</TabsTrigger>
                </TabsList>
                <TabsContent
                  value={search.tab ?? "all"}
                  aria-label={
                    search.tab === "active"
                      ? "Active Treatments"
                      : "All Patients"
                  }
                >
                  <PatientTable
                    data={data}
                    onCreate={() => open("patient")}
                    onEdit={openPatientEdit}
                    onDelete={(patient) => {
                      const visits = data.appointments.filter(
                        (item) => item.patientId === patient.id
                      ).length
                      const notes = data.notes.filter(
                        (item) => item.patientId === patient.id
                      ).length
                      const plans = data.treatmentPlans.filter(
                        (item) => item.patientId === patient.id
                      ).length
                      if (
                        window.confirm(
                          `Delete ${patient.name} and their ${visits} visits, ${notes} clinical notes, and ${plans} treatment plans with their payments?`
                        )
                      ) {
                        void save(deletePatient({ data: { id: patient.id } }))
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>
            )}
            {view === "installments" && <InstallmentsView data={data} />}
            {view === "team" && (
              <>
                <Heading
                  title="Practitioners"
                  action={
                    <Button onClick={() => open("practitioner")}>
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        data-icon="inline-start"
                      />
                      Add practitioner
                    </Button>
                  }
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visiblePractitioners.map((item) => (
                    <Card key={item.id}>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <Initials name={item.name} color={item.color} />
                        <div>
                          <CardTitle>{item.name}</CardTitle>
                          <CardDescription>{item.title}</CardDescription>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              data.appointments.filter(
                                (visit) =>
                                  visit.practitionerId === item.id &&
                                  visit.status === "scheduled"
                              ).length
                            }{" "}
                            scheduled visits
                          </p>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                {!visiblePractitioners.length && (
                  <Empty
                    text={
                      search.q
                        ? "No practitioners match your search."
                        : "Add a practitioner to start scheduling visits."
                    }
                  />
                )}
              </>
            )}
          </div>
        </main>
        <ClinicForm
          key={`${form ?? "closed"}-${editingAppointmentId ?? editingPatientId ?? "new"}`}
          kind={form}
          setKind={setForm}
          data={data}
          patient={data.patients.find((item) => item.id === editingPatientId)}
          appointment={data.appointments.find(
            (item) => item.id === editingAppointmentId
          )}
          save={save}
        />
      </SidebarProvider>
    </TooltipProvider>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <EmptyState className="border bg-card">
      <EmptyHeader>
        <EmptyDescription>{text}</EmptyDescription>
      </EmptyHeader>
    </EmptyState>
  )
}

function ClinicForm({
  kind,
  setKind,
  data,
  patient,
  appointment,
  save,
}: {
  kind: FormKind
  setKind: (kind: FormKind) => void
  data: ClinicData
  patient?: Patient
  appointment?: Appointment
  save: (request: Promise<unknown>) => Promise<string>
}) {
  const [bookingPatient, setBookingPatient] = useState<Patient | null>(
    data.patients.find((item) => item.id === appointment?.patientId) ?? null
  )
  const [bookingPractitioner, setBookingPractitioner] = useState<
    ClinicData["practitioners"][number] | null
  >(
    data.practitioners.find(
      (item) => item.id === appointment?.practitionerId
    ) ?? null
  )
  const [reason, setReason] = useState(appointment?.reason ?? "")
  const recordError =
    kind === "editPatient" && !patient
      ? "This patient is no longer available."
      : kind === "editAppointment" && !appointment
        ? "This appointment is no longer available."
        : ""
  const [error, submit, saving] = useActionState(
    async (_previousError: string, fields: FormData) => {
      const value = (key: string) => String(fields.get(key) ?? "")
      let request: Promise<unknown> | undefined
      if (kind === "patient" || kind === "editPatient") {
        if (kind === "editPatient" && !patient) {
          return "This patient is no longer available"
        }
        const details = {
          name: value("name"),
          birthDate: value("birthDate"),
          phone: value("phone"),
          email: value("email"),
          medicalAlerts: value("medicalAlerts"),
        }
        if (kind === "editPatient" && patient) {
          request = updatePatient({ data: { id: patient.id, ...details } })
        } else {
          request = createPatient({ data: details })
        }
      }
      if (kind === "practitioner") {
        const color = value("color")
        if (
          color !== "teal" &&
          color !== "blue" &&
          color !== "violet" &&
          color !== "amber"
        ) {
          return "Choose a calendar color"
        }
        request = createPractitioner({
          data: {
            name: value("name"),
            title: value("title"),
            color,
          },
        })
      }
      if (kind === "appointment" || kind === "editAppointment") {
        if (kind === "editAppointment" && !appointment) {
          return "This appointment is no longer available"
        }
        if (!bookingPatient || !bookingPractitioner) {
          return "Choose a patient and practitioner"
        }
        if (!reason.trim()) {
          return "Enter a reason for the visit"
        }
        const details = {
          patientId: bookingPatient.id,
          practitionerId: bookingPractitioner.id,
          startsAt: new Date(value("startsAt")).toISOString(),
          durationMinutes: Number(value("durationMinutes")),
          reason: reason.trim(),
        }
        if (kind === "editAppointment" && appointment) {
          request = updateAppointment({
            data: { id: appointment.id, ...details },
          })
        } else {
          request = createAppointment({ data: details })
        }
      }
      return request ? save(request) : "Choose a form before saving."
    },
    ""
  )
  return (
    <Dialog
      open={kind !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) setKind(null)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {kind === "appointment" || kind === "editAppointment"
              ? kind === "editAppointment"
                ? "Edit appointment"
                : "New appointment"
              : kind === "patient" || kind === "editPatient"
                ? kind === "editPatient"
                  ? "Edit patient"
                  : "Add patient"
                : kind === "practitioner"
                  ? "Add practitioner"
                  : ""}
          </DialogTitle>
          <DialogDescription>
            {kind === "appointment" || kind === "editAppointment"
              ? "Choose the patient, practitioner, and visit time."
              : kind === "practitioner"
                ? "Enter the practitioner's name and specialty."
                : "Enter the patient's contact details and medical alerts."}
          </DialogDescription>
        </DialogHeader>
        <form action={submit}>
          <FieldGroup>
            {(kind === "appointment" || kind === "editAppointment") && (
              <>
                <Field label="Patient">
                  <Combobox
                    items={data.patients}
                    value={bookingPatient}
                    onValueChange={setBookingPatient}
                    itemToStringLabel={(item) => item.name}
                    itemToStringValue={(item) => item.name}
                  >
                    <ComboboxInput
                      className="w-full"
                      placeholder="Search patients"
                      aria-label="Patient"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No patients found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item.id} value={item}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
                <Field label="Practitioner">
                  <Combobox
                    items={data.practitioners}
                    value={bookingPractitioner}
                    onValueChange={setBookingPractitioner}
                    itemToStringLabel={(item) => item.name}
                    itemToStringValue={(item) => item.name}
                  >
                    <ComboboxInput
                      className="w-full"
                      placeholder="Search practitioners"
                      aria-label="Practitioner"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No practitioners found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item.id} value={item}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date and time">
                    <Input
                      name="startsAt"
                      type="datetime-local"
                      required
                      defaultValue={
                        appointment
                          ? new Date(
                              new Date(appointment.startsAt).getTime() -
                                new Date(
                                  appointment.startsAt
                                ).getTimezoneOffset() *
                                  60_000
                            )
                              .toISOString()
                              .slice(0, 16)
                          : undefined
                      }
                    />
                  </Field>
                  <Field label="Duration">
                    <select
                      name="durationMinutes"
                      className="form-select"
                      defaultValue={String(appointment?.durationMinutes ?? 30)}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </Field>
                </div>
                <Field label="Reason for visit">
                  <Combobox
                    items={[
                      "Routine cleaning",
                      "Dental consultation",
                      "Tooth extraction",
                      "Filling",
                      "Root canal",
                      "Braces adjustment",
                      "Follow-up",
                    ]}
                    value={reason}
                    onValueChange={(value) => setReason(value ?? "")}
                    inputValue={reason}
                    onInputValueChange={setReason}
                  >
                    <ComboboxInput
                      className="w-full"
                      placeholder="Choose or type a reason"
                      aria-label="Reason for visit"
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item} value={item}>
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
              </>
            )}
            {(kind === "patient" || kind === "editPatient") && (
              <>
                <Field label="Full name">
                  <Input
                    name="name"
                    required
                    placeholder="Patient name"
                    defaultValue={patient?.name}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date of birth">
                    <Input
                      name="birthDate"
                      type="date"
                      defaultValue={patient?.birthDate ?? ""}
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="Contact number"
                      defaultValue={patient?.phone ?? ""}
                    />
                  </Field>
                </div>
                <Field label="Email">
                  <Input
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    defaultValue={patient?.email ?? ""}
                  />
                </Field>
                <Field label="Medical alerts">
                  <Textarea
                    name="medicalAlerts"
                    placeholder="Allergies or important health notes"
                    defaultValue={patient?.medicalAlerts ?? ""}
                  />
                </Field>
              </>
            )}
            {kind === "practitioner" && (
              <>
                <Field label="Full name">
                  <Input name="name" required placeholder="Dr. First Last" />
                </Field>
                <Field label="Role or specialty">
                  <Input
                    name="title"
                    required
                    placeholder="e.g. General dentist"
                  />
                </Field>
                <Field label="Calendar color">
                  <select name="color" className="form-select">
                    <option value="teal">Teal</option>
                    <option value="blue">Blue</option>
                    <option value="violet">Violet</option>
                    <option value="amber">Amber</option>
                  </select>
                </Field>
              </>
            )}
            {(error || recordError) && (
              <p role="alert" className="text-sm text-destructive">
                {error || recordError}
              </p>
            )}
            <Button type="submit" disabled={saving || Boolean(recordError)}>
              {saving
                ? "Saving…"
                : kind === "appointment"
                  ? "Book appointment"
                  : kind === "editAppointment"
                    ? "Save changes"
                    : kind === "practitioner"
                      ? "Add practitioner"
                      : kind === "editPatient"
                        ? "Save changes"
                        : "Add patient"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CalendarView({
  data,
  onNew,
}: {
  data: ClinicData
  onNew: () => void
}) {
  const { search, updateSearch } = useDashboardSearch()
  const selectedIds = search.practitionerIds ?? []
  const current = new Date()
  const anchor = search.week ? new Date(`${search.week}T12:00:00`) : current
  const monday = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate() - ((anchor.getDay() + 6) % 7)
  )
  function moveWeek(offset: number) {
    const next = new Date(monday)
    next.setDate(next.getDate() + offset * 7)
    updateSearch({ week: next.toLocaleDateString("en-CA") })
  }
  const days = Array.from(
    { length: 7 },
    (_, index) =>
      new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + index
      )
  )
  const filtered = data.appointments.filter(
    (item) =>
      item.status !== "cancelled" &&
      (selectedIds.length === 0 || selectedIds.includes(item.practitionerId)) &&
      `${data.patients.find((patient) => patient.id === item.patientId)?.name ?? ""} ${data.practitioners.find((practitioner) => practitioner.id === item.practitionerId)?.name ?? ""} ${item.reason}`
        .toLowerCase()
        .includes((search.q ?? "").toLowerCase())
  )
  const selectedPractitioners = data.practitioners.filter((item) =>
    selectedIds.includes(item.id)
  )
  return (
    <>
      <Heading
        title="Appointment calendar"
        action={
          <Button onClick={onNew}>
            <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
            New appointment
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-3 md:p-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              aria-label="Previous week"
              onClick={() => moveWeek(-1)}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Next week"
              onClick={() => moveWeek(1)}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Button>
            <div>
              <p className="font-semibold">
                {format(days[0], { month: "long", day: "numeric" })} –{" "}
                {format(days[6], {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => updateSearch({ week: undefined })}
              >
                Jump to this week
              </button>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <Combobox
              items={data.practitioners}
              multiple
              value={selectedPractitioners}
              onValueChange={(items) =>
                updateSearch({
                  practitionerIds: items.length
                    ? items.map((item) => item.id)
                    : undefined,
                })
              }
              itemToStringLabel={(item) => item.name}
              itemToStringValue={(item) => item.name}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {selectedPractitioners.map((item) => (
                    <ComboboxChip key={item.id}>{item.name}</ComboboxChip>
                  ))}
                </ComboboxValue>
                <ComboboxChipsInput
                  aria-label="Filter practitioners"
                  placeholder={
                    selectedIds.length
                      ? "Add practitioner"
                      : "All practitioners"
                  }
                />
              </ComboboxChips>
              <ComboboxContent>
                <ComboboxEmpty>No practitioners found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[960px] grid-cols-7 divide-x">
            {days.map((day) => {
              const visits = filtered
                .filter((item) => dayKey(item.startsAt) === dayKey(day))
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
              return (
                <div key={day.toISOString()} className="min-h-[440px]">
                  <div
                    className={cn(
                      "border-b px-3 py-4",
                      dayKey(day) === dayKey(current)
                        ? "bg-secondary"
                        : "bg-muted/20"
                    )}
                  >
                    <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      {format(day, { weekday: "short" })}
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {day.getDate()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {visits.map((item) => {
                      const doctor = data.practitioners.find(
                        (p) => p.id === item.practitionerId
                      )
                      const person = data.patients.find(
                        (p) => p.id === item.patientId
                      )
                      return (
                        <Link
                          key={item.id}
                          to="/appointments/$appointmentId"
                          params={{ appointmentId: item.id }}
                          aria-label={`${time(item.startsAt)} ${person?.name ?? "Patient"} appointment details`}
                          search={(previous) => ({ sidebar: previous.sidebar })}
                          className={cn(
                            "rounded-lg border p-3 transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring",
                            colors[doctor?.color ?? "teal"] ?? colors.teal
                          )}
                        >
                          <p className="text-xs font-bold">
                            {time(item.startsAt)} · {item.durationMinutes}m
                          </p>
                          <p
                            className="mt-2 truncate text-sm font-semibold"
                            title={person?.name}
                          >
                            {person?.name ?? "Unknown patient"}
                          </p>
                          <p className="mt-1 truncate text-xs">{item.reason}</p>
                          <p
                            className="mt-2 truncate border-t border-current/20 pt-2 text-[11px]"
                            title={doctor?.name}
                          >
                            {doctor?.name}
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {data.practitioners.map((item) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2.5 rounded-full",
                item.color === "blue"
                  ? "bg-blue-500"
                  : item.color === "violet"
                    ? "bg-violet-500"
                    : item.color === "amber"
                      ? "bg-amber-500"
                      : "bg-primary"
              )}
            />
            {item.name}
          </span>
        ))}
      </div>
    </>
  )
}

function PatientTable({
  data,
  onCreate,
  onEdit,
  onDelete,
}: {
  data: ClinicData
  onCreate: () => void
  onEdit: (id: string) => void
  onDelete: (patient: Patient) => void
}) {
  const navigate = useNavigate()
  const { search, updateSearch } = useDashboardSearch()
  const treatments = Array.from(
    new Set([
      ...data.appointments.map((visit) => visit.reason),
      ...data.treatmentPlans.map((plan) => plan.procedure),
    ])
  ).sort()
  const rows = data.patients.flatMap((patient) => {
    const visits = data.appointments.filter(
      (visit) => visit.patientId === patient.id && visit.status !== "cancelled"
    )
    const plans = data.treatmentPlans.filter(
      (plan) => plan.patientId === patient.id
    )
    const active =
      visits.some((visit) => visit.status === "scheduled") ||
      plans.some(
        (plan) =>
          plan.totalCents >
          data.installmentPayments
            .filter((payment) => payment.planId === plan.id)
            .reduce((paid, payment) => paid + payment.amountCents, 0)
      )
    if (
      (search.tab === "active" && !active) ||
      (search.treatment &&
        !visits.some((visit) => visit.reason === search.treatment) &&
        !plans.some((plan) => plan.procedure === search.treatment)) ||
      (search.practitionerId &&
        !visits.some(
          (visit) => visit.practitionerId === search.practitionerId
        ) &&
        !plans.some((plan) => plan.practitionerId === search.practitionerId))
    )
      return []
    const lastVisit = visits
      .filter((visit) => visit.status === "completed")
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .at(0)
    return [
      {
        ...patient,
        lastVisit: lastVisit?.startsAt,
        lastTreatment: lastVisit?.reason ?? "—",
        dentist:
          data.practitioners.find(
            (practitioner) => practitioner.id === lastVisit?.practitionerId
          )?.name ?? "—",
      },
    ]
  })
  type PatientRow = (typeof rows)[number]
  const helper = createColumnHelper<ClinicTableFeatures, PatientRow>()
  const columns = helper.columns([
    helper.accessor("name", {
      header: ({ column }) => {
        const sort = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(sort === "asc")}
          >
            Patient Name
            <SortIndicator direction={sort} />
          </Button>
        )
      },
      filterFn: "includesString",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-left">
          <Initials name={row.original.name} />
          <Link
            to="/patients/$patientId"
            params={{ patientId: row.original.id }}
            search={(previous) => ({ sidebar: previous.sidebar })}
            onClick={(event) => event.stopPropagation()}
            className="font-medium hover:text-primary hover:underline"
          >
            {row.original.name}
          </Link>
        </div>
      ),
    }),
    helper.accessor("phone", {
      header: "Phone Number",
      cell: ({ row }) => row.original.phone || "—",
    }),
    helper.accessor("email", {
      header: "Email Address",
      cell: ({ row }) => row.original.email || "—",
    }),
    helper.accessor("lastVisit", {
      header: "Last Visit",
      cell: ({ row }) =>
        row.original.lastVisit
          ? format(row.original.lastVisit, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    }),
    helper.accessor("lastTreatment", { header: "Last Treatment" }),
    helper.accessor("dentist", { header: "Dentist" }),
    helper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Actions for ${row.original.name}`}
                />
              }
            >
              <img src="/icons/more.svg" alt="" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  render={
                    <Link
                      to="/patients/$patientId"
                      params={{ patientId: row.original.id }}
                      search={(previous) => ({ sidebar: previous.sidebar })}
                    />
                  }
                >
                  View patient
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                  Edit patient
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(row.original)}
                >
                  Delete patient
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
  ])
  return (
    <ClinicTable
      data={rows}
      columns={columns}
      onRowClick={(patient) =>
        void navigate({
          to: "/patients/$patientId",
          params: { patientId: patient.id },
          search: (previous) => ({ sidebar: previous.sidebar }),
        })
      }
      searchColumn="name"
      searchPlaceholder="Search patient"
      emptyMessage="No patients match this selection."
      toolbar={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={search.treatment ? "secondary" : "filter"}
                  className="max-w-52"
                />
              }
            >
              <img src="/icons/treatment-filter.svg" alt="" />
              <span className="truncate">
                {search.treatment ?? "Treatment"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={search.treatment ?? ""}
                onValueChange={(value) =>
                  updateSearch({
                    treatment: value || undefined,
                    page: undefined,
                  })
                }
              >
                <DropdownMenuRadioItem value="">
                  All treatments
                </DropdownMenuRadioItem>
                {treatments.map((treatment) => (
                  <DropdownMenuRadioItem key={treatment} value={treatment}>
                    {treatment}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={search.practitionerId ? "secondary" : "filter"}
                  className="max-w-52"
                />
              }
            >
              <img src="/icons/practitioner-filter.svg" alt="" />
              <span className="truncate">
                {data.practitioners.find(
                  (practitioner) => practitioner.id === search.practitionerId
                )?.name ?? "Practitioner"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={search.practitionerId ?? ""}
                onValueChange={(value) =>
                  updateSearch({
                    practitionerId: value || undefined,
                    page: undefined,
                  })
                }
              >
                <DropdownMenuRadioItem value="">
                  All practitioners
                </DropdownMenuRadioItem>
                {data.practitioners.map((practitioner) => (
                  <DropdownMenuRadioItem
                    key={practitioner.id}
                    value={practitioner.id}
                  >
                    {practitioner.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="ml-auto" onClick={onCreate}>
            <img src="/icons/add.svg" alt="" />
            Create Patient
          </Button>
        </>
      }
    />
  )
}

function AppointmentTable({
  data,
  onEdit,
  onDelete,
  onStatus,
}: {
  data: ClinicData
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onStatus: (id: string, status: Appointment["status"]) => void
}) {
  const navigate = useNavigate()
  type Visit = Appointment & { patientName: string; practitionerName: string }
  const rows = data.appointments.map((item) => ({
    ...item,
    patientName:
      data.patients.find((p) => p.id === item.patientId)?.name ??
      "Unknown patient",
    practitionerName:
      data.practitioners.find((p) => p.id === item.practitionerId)?.name ??
      "Unknown practitioner",
  }))
  const helper = createColumnHelper<ClinicTableFeatures, Visit>()
  const columns = helper.columns([
    helper.accessor("patientName", {
      header: ({ column }) => {
        const sort = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sort === "asc")}
          >
            Patient
            <SortIndicator direction={sort} />
          </Button>
        )
      },
      filterFn: "includesString",
      cell: ({ row }) => (
        <Link
          to="/appointments/$appointmentId"
          params={{ appointmentId: row.original.id }}
          search={(previous) => ({ sidebar: previous.sidebar })}
          className="font-medium hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.original.patientName}
        </Link>
      ),
    }),
    helper.accessor("startsAt", {
      header: ({ column }) => {
        const sort = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sort === "asc")}
          >
            Date & time
            <SortIndicator direction={sort} />
          </Button>
        )
      },
      cell: ({ row }) => (
        <span>
          {format(row.original.startsAt, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          <span className="block text-xs text-muted-foreground">
            {time(row.original.startsAt)}
          </span>
        </span>
      ),
    }),
    helper.accessor("practitionerName", { header: "Practitioner" }),
    helper.accessor("reason", { header: "Visit" }),
    helper.accessor("status", {
      header: "Status",
      cell: ({ row }) => <Status status={row.original.status} />,
    }),
    helper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Actions for ${row.original.patientName} appointment`}
                />
              }
            >
              <span aria-hidden="true">•••</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                  Edit visit
                </DropdownMenuItem>
                {row.original.status !== "scheduled" && (
                  <DropdownMenuItem
                    onClick={() => onStatus(row.original.id, "scheduled")}
                  >
                    Mark scheduled
                  </DropdownMenuItem>
                )}
                {row.original.status !== "completed" && (
                  <DropdownMenuItem
                    onClick={() => onStatus(row.original.id, "completed")}
                  >
                    Mark completed
                  </DropdownMenuItem>
                )}
                {row.original.status !== "cancelled" && (
                  <DropdownMenuItem
                    onClick={() => onStatus(row.original.id, "cancelled")}
                  >
                    Cancel visit
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(row.original.id)}
                >
                  Delete visit
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
  ])
  return (
    <ClinicTable
      data={rows}
      columns={columns}
      onRowClick={(visit) =>
        void navigate({
          to: "/appointments/$appointmentId",
          params: { appointmentId: visit.id },
          search: (previous) => ({ sidebar: previous.sidebar }),
        })
      }
      searchColumn="patientName"
      searchPlaceholder="Search appointments by patient..."
      emptyMessage="No appointments found."
    />
  )
}

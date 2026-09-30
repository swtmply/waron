import { createFileRoute } from "@tanstack/react-router"
import { ClinicDashboard } from "@/components/clinic-dashboard"
import { getClinicData } from "@/lib/clinic.functions"

export const Route = createFileRoute("/calendar")({
  loader: () => getClinicData(),
  component: () => (
    <ClinicDashboard data={Route.useLoaderData()} view="calendar" />
  ),
})

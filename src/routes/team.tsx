import { createFileRoute } from "@tanstack/react-router"
import { ClinicDashboard } from "@/components/clinic-dashboard"
import { getClinicData } from "@/lib/clinic.functions"

export const Route = createFileRoute("/team")({
  loader: () => getClinicData(),
  component: () => (
    <ClinicDashboard data={Route.useLoaderData()} view="team" />
  ),
})

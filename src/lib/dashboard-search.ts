import { useNavigate, useSearch } from "@tanstack/react-router"
import { z } from "zod"

export const dashboardSearchSchema = z.object({
  sidebar: z.enum(["expanded", "collapsed"]).optional().catch(undefined),
  q: z.string().max(200).optional().catch(undefined),
  tab: z.enum(["all", "active"]).optional().catch(undefined),
  treatment: z.string().max(200).optional().catch(undefined),
  practitionerId: z.string().max(100).optional().catch(undefined),
  practitionerIds: z
    .array(z.string().max(100))
    .max(100)
    .optional()
    .catch(undefined),
  patientId: z.string().max(100).optional().catch(undefined),
  week: z.iso.date().optional().catch(undefined),
  sort: z.string().max(100).optional().catch(undefined),
  order: z.enum(["asc", "desc"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100_000).optional().catch(undefined),
  form: z
    .enum([
      "appointment",
      "editAppointment",
      "patient",
      "editPatient",
      "practitioner",
      "treatmentPlan",
      "payment",
    ])
    .optional()
    .catch(undefined),
  recordId: z.string().max(100).optional().catch(undefined),
})

export function useDashboardSearch() {
  const search = useSearch({ from: "__root__" })
  const navigate = useNavigate()

  function updateSearch(
    updates: Partial<z.infer<typeof dashboardSearchSchema>>,
    replace = false
  ) {
    void navigate({
      to: ".",
      search: (previous) => ({ ...previous, ...updates }),
      replace,
      resetScroll: false,
    })
  }

  return { search, updateSearch }
}

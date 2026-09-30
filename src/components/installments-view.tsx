import { useActionState } from "react"
import { Link, useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  addInstallmentPayment,
  createTreatmentPlan,
} from "@/lib/clinic.functions"
import type { getClinicData } from "@/lib/clinic.functions"
import { useDashboardSearch } from "@/lib/dashboard-search"

type ClinicData = Awaited<ReturnType<typeof getClinicData>>

const pesos = (cents: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    cents / 100
  )
const date = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`))

export function InstallmentsView({ data }: { data: ClinicData }) {
  const { search, updateSearch } = useDashboardSearch()
  const patientId = search.patientId ?? ""
  const practitionerId = search.practitionerId ?? ""
  const showNewPlan = search.form === "treatmentPlan"
  const paymentPlanId = search.form === "payment" ? search.recordId : undefined
  const plans = data.treatmentPlans
    .filter(
      (plan) =>
        (!patientId || plan.patientId === patientId) &&
        (!practitionerId || plan.practitionerId === practitionerId) &&
        `${plan.procedure} ${data.patients.find((patient) => patient.id === plan.patientId)?.name ?? ""}`
          .toLowerCase()
          .includes((search.q ?? "").toLowerCase())
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const outstanding = plans.reduce((total, plan) => {
    const paid = data.installmentPayments
      .filter((payment) => payment.planId === plan.id)
      .reduce((sum, payment) => sum + payment.amountCents, 0)
    return total + plan.totalCents - paid
  }, 0)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Treatment plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Treatment balances by patient and practitioner
          </p>
        </div>
        <Button
          onClick={() => {
            updateSearch({
              form: showNewPlan ? undefined : "treatmentPlan",
              recordId: undefined,
            })
          }}
        >
          {showNewPlan ? "Close form" : "New treatment plan"}
        </Button>
      </div>

      {showNewPlan && (
        <TreatmentPlanForm
          data={data}
          patientId={patientId}
          practitionerId={practitionerId}
        />
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-col gap-1.5 text-sm font-medium">
          Patient
          <select
            value={patientId}
            onChange={(event) =>
              updateSearch({ patientId: event.target.value || undefined })
            }
            className="form-select"
          >
            <option value="">All patients</option>
            {data.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-48 flex-col gap-1.5 text-sm font-medium">
          Practitioner
          <select
            value={practitionerId}
            onChange={(event) =>
              updateSearch({ practitionerId: event.target.value || undefined })
            }
            className="form-select"
          >
            <option value="">All practitioners</option>
            {data.practitioners.map((practitioner) => (
              <option key={practitioner.id} value={practitioner.id}>
                {practitioner.name}
              </option>
            ))}
          </select>
        </label>
        <p className="ml-auto text-sm">
          <span className="text-muted-foreground">Remaining balance: </span>
          <strong>{pesos(outstanding)}</strong>
        </p>
      </div>

      {plans.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No treatment plans for this selection.
        </p>
      )}
      {plans.map((plan) => {
        const payments = data.installmentPayments
          .filter((payment) => payment.planId === plan.id)
          .sort(
            (a, b) =>
              b.paidOn.localeCompare(a.paidOn) ||
              b.createdAt.localeCompare(a.createdAt)
          )
        const paid = payments.reduce(
          (sum, payment) => sum + payment.amountCents,
          0
        )
        const remaining = plan.totalCents - paid
        const patient = data.patients.find((item) => item.id === plan.patientId)
        const practitioner = data.practitioners.find(
          (item) => item.id === plan.practitionerId
        )
        return (
          <Card key={plan.id} size="sm">
            <CardHeader className="flex flex-wrap items-start justify-between gap-3 sm:flex-row">
              <div>
                <CardTitle>{plan.procedure}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient && (
                    <Link
                      to="/patients/$patientId"
                      params={{ patientId: patient.id }}
                      search={(previous) => ({ sidebar: previous.sidebar })}
                      className="hover:underline"
                    >
                      {patient.name}
                    </Link>
                  )}{" "}
                  · {practitioner?.name}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {remaining === 0
                  ? "Paid in full"
                  : `${pesos(remaining)} remaining`}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Total {pesos(plan.totalCents)} · Paid {pesos(paid)}
              </p>
              {payments.length > 0 && (
                <div className="border-t pt-3">
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    Payment history
                  </h3>
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between gap-3 py-1 text-sm"
                    >
                      <span>{date(payment.paidOn)}</span>
                      <span>{pesos(payment.amountCents)}</span>
                    </div>
                  ))}
                </div>
              )}
              {remaining > 0 &&
                (paymentPlanId === plan.id ? (
                  <PaymentForm planId={plan.id} remainingCents={remaining} />
                ) : (
                  <Button
                    variant="outline"
                    className="self-start"
                    onClick={() => {
                      updateSearch({ form: "payment", recordId: plan.id })
                    }}
                  >
                    Record payment
                  </Button>
                ))}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}

function TreatmentPlanForm({
  data,
  patientId,
  practitionerId,
}: {
  data: ClinicData
  patientId: string
  practitionerId: string
}) {
  const router = useRouter()
  const { updateSearch } = useDashboardSearch()
  const [error, savePlan, saving] = useActionState(
    async (_previousError: string, fields: FormData) => {
      const details = {
        patientId: String(fields.get("patientId") ?? ""),
        practitionerId: String(fields.get("practitionerId") ?? ""),
        procedure: String(fields.get("procedure") ?? ""),
        total: String(fields.get("total") ?? ""),
      }
      try {
        await createTreatmentPlan({ data: details })
        await router.invalidate()
        updateSearch({
          patientId: details.patientId,
          practitionerId: details.practitionerId,
          form: undefined,
          recordId: undefined,
        })
        return ""
      } catch (cause) {
        return cause instanceof Error ? cause.message : "Could not save plan"
      }
    },
    ""
  )

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>New treatment plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={savePlan} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Patient
            <select
              name="patientId"
              required
              defaultValue={patientId}
              className="form-select"
            >
              <option value="" disabled>
                Select patient
              </option>
              {data.patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Practitioner
            <select
              name="practitionerId"
              required
              defaultValue={practitionerId}
              className="form-select"
            >
              <option value="" disabled>
                Select practitioner
              </option>
              {data.practitioners.map((practitioner) => (
                <option key={practitioner.id} value={practitioner.id}>
                  {practitioner.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Procedure
            <Input name="procedure" required placeholder="e.g. Braces" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Total fee (₱)
            <Input
              name="total"
              type="number"
              min="0.01"
              max="10000000"
              step="0.01"
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving} className="sm:col-span-2">
            {saving ? "Saving…" : "Save plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PaymentForm({
  planId,
  remainingCents,
}: {
  planId: string
  remainingCents: number
}) {
  const router = useRouter()
  const { updateSearch } = useDashboardSearch()
  const [error, savePayment, saving] = useActionState(
    async (_previousError: string, fields: FormData) => {
      try {
        await addInstallmentPayment({
          data: {
            planId,
            amount: String(fields.get("amount") ?? ""),
            paidOn: String(fields.get("paidOn") ?? ""),
          },
        })
        await router.invalidate()
        updateSearch({ form: undefined, recordId: undefined })
        return ""
      } catch (cause) {
        return cause instanceof Error ? cause.message : "Could not save payment"
      }
    },
    ""
  )

  return (
    <form
      action={savePayment}
      className="flex flex-wrap items-end gap-3 border-t pt-3"
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Payment (₱)
        <Input
          name="amount"
          type="number"
          min="0.01"
          max={(remainingCents / 100).toFixed(2)}
          step="0.01"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Date paid
        <Input
          name="paidOn"
          type="date"
          defaultValue={new Date().toLocaleDateString("en-CA")}
          required
        />
      </label>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save payment"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => updateSearch({ form: undefined, recordId: undefined })}
      >
        Cancel
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}

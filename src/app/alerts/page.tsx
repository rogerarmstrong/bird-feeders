import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getOpenAlerts } from "@/lib/monitoring";
import { formatRelativeTime } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const severityStyles: Record<string, string> = {
  INFO: "bg-sky-100 text-sky-800",
  WARNING: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-rose-100 text-rose-800"
};

export default async function AlertsPage() {
  await requireSession();

  const alerts = await getOpenAlerts();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-moss">Operations</p>
            <h1 className="mt-2 text-3xl font-black text-canopy sm:text-4xl">Open Alerts</h1>
            <p className="mt-3 max-w-2xl text-canopy/65">
              Prioritize low feed levels, device connectivity, and maintenance issues.
            </p>
          </div>
          <div className="rounded-3xl bg-canopy p-5 text-white">
            <p className="text-sm text-white/70">Needs attention</p>
            <p className="text-4xl font-black">{alerts.length}</p>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-[2rem] border border-canopy/10 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-moss" />
          <h2 className="mt-4 text-2xl font-black text-canopy">All clear</h2>
          <p className="mt-2 text-canopy/60">No unresolved feeder alerts right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {alerts.map((alert) => (
            <Link
              key={alert.id}
              href={`/feeders/${alert.feederId}`}
              className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm transition hover:border-moss/40 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-seed/40 p-3 text-canopy">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-canopy">{alert.feeder.name}</p>
                    <p className="text-sm text-canopy/60">{alert.feeder.location}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${severityStyles[alert.severity]}`}>
                  {alert.severity.toLowerCase()}
                </span>
              </div>
              <p className="mt-5 text-lg font-bold text-canopy">{alert.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-canopy/55">
                <span className="rounded-full bg-canopy/5 px-3 py-1 font-bold">{alert.type}</span>
                <span>{formatRelativeTime(alert.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

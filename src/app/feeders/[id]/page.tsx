import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { AlertTriangle, ArrowLeft, Clock, Radio, Wheat } from "lucide-react";
import { getFeederDetail } from "@/lib/monitoring";
import { formatRelativeTime } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    id: string;
  };
};

const statusStyles: Record<string, string> = {
  ONLINE: "bg-emerald-100 text-emerald-800",
  DEGRADED: "bg-amber-100 text-amber-800",
  OFFLINE: "bg-rose-100 text-rose-800"
};

const severityStyles: Record<string, string> = {
  INFO: "bg-sky-100 text-sky-800",
  WARNING: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-rose-100 text-rose-800"
};

export default async function FeederDetailPage({ params }: PageProps) {
  await requireSession();

  const feeder = await getFeederDetail(params.id);

  if (!feeder) {
    notFound();
  }

  const latestMeasurement = feeder.measurements[0];
  const measurements = [...feeder.measurements].reverse();
  const openAlerts = feeder.alerts.filter((alert) => !alert.resolved);

  return (
    <div className="space-y-6">
      <Link href="/feeders" className="inline-flex items-center gap-2 text-sm font-bold text-moss hover:text-canopy">
        <ArrowLeft className="h-4 w-4" />
        Back to feeders
      </Link>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-canopy sm:text-4xl">{feeder.name}</h1>
              {feeder.device ? (
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[feeder.device.status]}`}>
                  {feeder.device.status.toLowerCase()}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-canopy/65">{feeder.location}</p>
            <p className="mt-2 text-sm font-bold text-canopy/70">
              Assigned to {feeder.assignedUser?.name ?? feeder.assignedUser?.email ?? "Unassigned"}
            </p>
            {feeder.notes ? (
              <div className="mt-4 rounded-2xl bg-canopy/5 p-4 text-sm text-canopy/70">
                <p className="font-bold text-canopy">Notes</p>
                <p className="mt-1">{feeder.notes}</p>
              </div>
            ) : null}
            <div className="mt-6 h-4 overflow-hidden rounded-full bg-canopy/10">
              <div
                className="h-full rounded-full bg-moss"
                style={{ width: `${latestMeasurement?.fillPercent ?? 0}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-medium text-canopy/70">
              {latestMeasurement
                ? `${latestMeasurement.weightGrams}g remaining of ${feeder.capacityGrams}g capacity`
                : "No feed measurements recorded"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric icon={Wheat} label="Fill level" value={`${latestMeasurement?.fillPercent ?? 0}%`} />
            <Metric
              icon={Clock}
              label="Last seen"
              value={feeder.device ? formatRelativeTime(feeder.device.lastSeenAt) : "Never"}
            />
            <Metric icon={Radio} label="Device status" value={feeder.device?.status.toLowerCase() ?? "unknown"} />
            <Metric icon={AlertTriangle} label="Clean status" value={formatStatus(feeder.cleanStatus)} />
            <Metric icon={Wheat} label="Fill status" value={formatStatus(feeder.fillStatus)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Clock className="h-5 w-5 text-moss" />
            <div>
              <h2 className="text-xl font-bold text-canopy">Recent Visits</h2>
              <p className="text-sm text-canopy/60">Species detected at this feeder</p>
            </div>
          </div>
          <div className="space-y-3">
            {feeder.visits.map((visit) => (
              <div key={visit.id} className="rounded-2xl bg-canopy/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-canopy">{visit.species}</p>
                    <p className="text-sm text-canopy/60">
                      {formatRelativeTime(visit.observedAt)} - {visit.durationSeconds}s visit
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-canopy">
                    {Math.round(visit.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-canopy">Feed History</h2>
                <p className="text-sm text-canopy/60">Recent fill-level measurements</p>
              </div>
            </div>
            <div className="flex h-56 items-end gap-2 rounded-3xl bg-canopy/5 p-4">
              {measurements.map((measurement) => (
                <div key={measurement.id} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end">
                    <div
                      className="w-full rounded-t-xl bg-moss"
                      style={{ height: `${Math.max(measurement.fillPercent, 4)}%` }}
                      title={`${measurement.fillPercent}%`}
                    />
                  </div>
                  <span className="text-xs font-bold text-canopy/60">{measurement.fillPercent}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-moss" />
              <div>
                <h2 className="text-xl font-bold text-canopy">Alerts</h2>
                <p className="text-sm text-canopy/60">{openAlerts.length} open alerts</p>
              </div>
            </div>
            <div className="space-y-3">
              {feeder.alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-canopy/10 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${severityStyles[alert.severity]}`}>
                      {alert.severity.toLowerCase()}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide text-canopy/45">{alert.type}</span>
                  </div>
                  <p className="mt-3 font-medium text-canopy">{alert.message}</p>
                  <p className="mt-2 text-sm text-canopy/55">{formatRelativeTime(alert.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-canopy/5 p-4">
      <Icon className="h-5 w-5 text-moss" />
      <p className="mt-3 text-sm text-canopy/55">{label}</p>
      <p className="mt-1 text-xl font-black text-canopy">{value}</p>
    </div>
  );
}

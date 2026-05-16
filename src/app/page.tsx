import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bird,
  MapPin,
  Radio,
  Wheat
} from "lucide-react";
import { getDashboardMetrics } from "@/lib/monitoring";
import { formatPercent, formatRelativeTime } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { FeederServiceMap } from "@/app/feeder-service-map";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  ONLINE: "bg-emerald-100 text-emerald-800",
  DEGRADED: "bg-amber-100 text-amber-800",
  OFFLINE: "bg-rose-100 text-rose-800"
};

const SERVICE_HOURS = 24;
const FILL_HOURS = 72;

export default async function DashboardPage() {
  await requireSession();

  const { feeders, summary, recentVisits } = await getDashboardMetrics();
  const mappedFeeders = feeders.filter(
    (feeder) => typeof feeder.latitude === "number" && typeof feeder.longitude === "number"
  );
  const mapFeeders = mappedFeeders.map((feeder) => {
    const latestMeasurement = feeder.measurements[0];

    return {
      id: feeder.id,
      name: feeder.name,
      latitude: feeder.latitude ?? 0,
      longitude: feeder.longitude ?? 0,
      lastCleanedAt: feeder.lastCleanedAt.toISOString(),
      cleanStatus: feeder.cleanStatus,
      fillStatus: feeder.fillStatus,
      assignedUser: feeder.assignedUser?.name ?? feeder.assignedUser?.email ?? "Unassigned",
      latestMeasurement: latestMeasurement
        ? {
            fillPercent: latestMeasurement.fillPercent,
            measuredAt: latestMeasurement.measuredAt.toISOString()
          }
        : null
    };
  });

  const cards = [
    {
      label: "Active feeders",
      value: `${summary.activeFeeders}/${summary.totalFeeders}`,
      detail: "Online or degraded",
      icon: Radio
    },
    {
      label: "Visits today",
      value: summary.todayVisits,
      detail: "Recorded since midnight",
      icon: Bird
    },
    {
      label: "Average fill",
      value: formatPercent(summary.averageFill),
      detail: "Latest measurement per feeder",
      icon: Wheat
    },
    {
      label: "Open alerts",
      value: summary.openAlerts,
      detail: "Needs attention",
      icon: AlertTriangle
    }
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-canopy p-6 text-white shadow-xl shadow-canopy/10 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
              Bird feeder monitoring center
            </p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              University bird-feeder monitoring project
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Track feed level and cleaning of feeders
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-5">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-seed" />
              <div>
                <p className="text-sm text-white/70">System status</p>
                <p className="text-2xl font-bold">{summary.openAlerts === 0 ? "Clear" : "Action needed"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {summary.activeFeeders} feeders are reporting, with an average fill level of{" "}
              {formatPercent(summary.averageFill)}.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="rounded-3xl border border-canopy/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-canopy/60">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-canopy">{card.value}</p>
                </div>
                <span className="rounded-2xl bg-seed/40 p-3 text-canopy">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-sm text-canopy/60">{card.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-moss" />
              <h2 className="text-xl font-bold text-canopy">Feeder Service Map</h2>
            </div>
            <p className="mt-1 text-sm text-canopy/60">
              Green feeders were cleaned within {SERVICE_HOURS} hours and filled within {FILL_HOURS} hours.
            </p>
          </div>
          <div className="flex gap-3 text-xs font-bold text-canopy/65">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Fresh
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              Needs service
            </span>
          </div>
        </div>

        <FeederServiceMap feeders={mapFeeders} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-canopy">Feeder Fleet</h2>
              <p className="text-sm text-canopy/60">Latest readings from each station</p>
            </div>
            <Link href="/feeders" className="text-sm font-semibold text-moss hover:text-canopy">
              View all
            </Link>
          </div>
          <div className="grid gap-4">
            {feeders.map((feeder) => {
              const measurement = feeder.measurements[0];
              const openAlertCount = feeder.alerts.length;

              return (
                <Link
                  key={feeder.id}
                  href={`/feeders/${feeder.id}`}
                  className="grid gap-4 rounded-3xl border border-canopy/10 p-4 transition hover:border-moss/40 hover:shadow-md md:grid-cols-[1.1fr_0.9fr]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-canopy">{feeder.name}</h3>
                      {feeder.device ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[feeder.device.status]}`}>
                          {feeder.device.status.toLowerCase()}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-canopy/60">{feeder.location}</p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-canopy/10">
                      <div
                        className="h-full rounded-full bg-moss"
                        style={{ width: `${measurement?.fillPercent ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-medium text-canopy">
                      {measurement ? `${measurement.fillPercent}% full` : "No feed readings yet"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-canopy/5 p-3">
                      <p className="text-canopy/55">Alerts</p>
                      <p className="mt-1 font-bold">{openAlertCount}</p>
                    </div>
                    <div className="rounded-2xl bg-canopy/5 p-3">
                      <p className="text-canopy/55">Seen</p>
                      <p className="mt-1 font-bold">
                        {feeder.device ? formatRelativeTime(feeder.device.lastSeenAt) : "Never"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-canopy/5 p-3">
                      <p className="text-canopy/55">Status</p>
                      <p className="mt-1 font-bold">{feeder.device?.status.toLowerCase() ?? "unknown"}</p>
                    </div>
                    <div className="rounded-2xl bg-canopy/5 p-3">
                      <p className="text-canopy/55">Assigned</p>
                      <p className="mt-1 truncate font-bold">
                        {feeder.assignedUser?.name ?? feeder.assignedUser?.email ?? "Unassigned"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Bird className="h-5 w-5 text-moss" />
            <div>
              <h2 className="text-xl font-bold text-canopy">Recent Visits</h2>
              <p className="text-sm text-canopy/60">Latest detected bird activity</p>
            </div>
          </div>
          <div className="space-y-3">
            {recentVisits.map((visit) => (
              <div key={visit.id} className="rounded-2xl bg-canopy/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-canopy">{visit.species}</p>
                    <p className="text-sm text-canopy/60">{visit.feeder.name}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-canopy">
                    x{visit.count}
                  </span>
                </div>
                <p className="mt-3 text-sm text-canopy/60">
                  {formatRelativeTime(visit.observedAt)} - {Math.round(visit.confidence * 100)}% confidence
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

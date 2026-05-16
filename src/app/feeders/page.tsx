import Link from "next/link";
import { Clock, MapPin, Wheat } from "lucide-react";
import { FeederManagement } from "@/app/feeders/feeder-management";
import { getAssignableUsers, getFeeders } from "@/lib/monitoring";
import { formatRelativeTime } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  ONLINE: "bg-emerald-100 text-emerald-800",
  DEGRADED: "bg-amber-100 text-amber-800",
  OFFLINE: "bg-rose-100 text-rose-800"
};

export default async function FeedersPage() {
  await requireSession();

  const [feeders, users] = await Promise.all([getFeeders(), getAssignableUsers()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-moss">Monitoring</p>
        <h1 className="mt-2 text-3xl font-black text-canopy sm:text-4xl">Feeder Stations</h1>
        <p className="mt-3 max-w-2xl text-canopy/65">
          Review each feeder&apos;s latest seed level, device health, and recent activity.
        </p>
      </div>

      <FeederManagement feeders={feeders} users={users} />

      <div className="grid gap-5 lg:grid-cols-3">
        {feeders.map((feeder) => {
          const measurement = feeder.measurements[0];
          const latestVisit = feeder.visits[0];

          return (
            <Link
              key={feeder.id}
              href={`/feeders/${feeder.id}`}
              className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-canopy">{feeder.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-canopy/60">
                    <MapPin className="h-4 w-4" />
                    {feeder.location}
                  </p>
                  <p className="mt-2 text-sm font-medium text-canopy/70">
                    Assigned to {feeder.assignedUser?.name ?? feeder.assignedUser?.email ?? "Unassigned"}
                  </p>
                  {feeder.notes ? (
                    <p className="mt-2 line-clamp-2 text-sm text-canopy/55">{feeder.notes}</p>
                  ) : null}
                </div>
                {feeder.device ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[feeder.device.status]}`}>
                    {feeder.device.status.toLowerCase()}
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-canopy/60">Feed level</p>
                    <p className="text-3xl font-black text-canopy">{measurement?.fillPercent ?? 0}%</p>
                  </div>
                  <Wheat className="h-8 w-8 text-moss" />
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-canopy/10">
                  <div className="h-full rounded-full bg-moss" style={{ width: `${measurement?.fillPercent ?? 0}%` }} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-canopy/5 p-3">
                  <p className="flex items-center gap-1.5 text-canopy/55">
                    <Clock className="h-4 w-4" />
                    Last seen
                  </p>
                  <p className="mt-1 font-bold text-canopy">
                    {feeder.device ? formatRelativeTime(feeder.device.lastSeenAt) : "Never"}
                  </p>
                </div>
                <div className="rounded-2xl bg-canopy/5 p-3">
                  <p className="text-canopy/55">Status</p>
                  <p className="mt-1 font-bold text-canopy">
                    {feeder.device?.status.toLowerCase() ?? "unknown"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-seed/30 p-4 text-sm text-canopy">
                <p className="font-bold">
                  {formatStatus(feeder.cleanStatus)} / {formatStatus(feeder.fillStatus)}
                </p>
                <p className="mt-1 text-canopy/70">
                  {latestVisit
                    ? `${latestVisit.species} (${formatRelativeTime(latestVisit.observedAt)})`
                    : "No visits recorded yet"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
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

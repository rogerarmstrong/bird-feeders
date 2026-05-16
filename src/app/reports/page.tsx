import Link from "next/link";
import { FileText } from "lucide-react";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-moss">Reports</p>
        <h1 className="mt-2 text-3xl font-black text-canopy sm:text-4xl">Feeder History</h1>
        <p className="mt-3 max-w-2xl text-canopy/65">
          Download a PDF audit report showing feeder edits, timestamps, and the user who made each change.
        </p>
      </div>

      <section className="rounded-[2rem] border border-canopy/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="rounded-3xl bg-seed/40 p-4 text-canopy">
              <FileText className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-canopy">Feeder edit history PDF</h2>
              <p className="mt-1 text-sm text-canopy/60">
                Includes create, update, and delete records ordered from newest to oldest.
              </p>
            </div>
          </div>
          <Link
            href="/api/reports/feeders/history.pdf"
            className="rounded-2xl bg-canopy px-5 py-3 text-center font-bold text-white transition hover:bg-moss"
          >
            Download PDF
          </Link>
        </div>
      </section>
    </div>
  );
}

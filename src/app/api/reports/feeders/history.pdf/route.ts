import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Snapshot = {
  name?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  capacityGrams?: number;
  notes?: string;
  cleanStatus?: string;
  fillStatus?: string;
  assignedUserId?: string | null;
  assignedUser?: string | null;
  assignedUserEmail?: string | null;
  latestFillPercent?: number;
  latestWeightGrams?: number;
};

function parseSnapshot(value: string | null): Snapshot | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Snapshot;
  } catch {
    return null;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function assignedUserEmail(snapshot: Snapshot, usersById: Map<string, string>) {
  if (snapshot.assignedUserEmail) {
    return snapshot.assignedUserEmail;
  }

  if (snapshot.assignedUserId) {
    return usersById.get(snapshot.assignedUserId) ?? "Unknown user";
  }

  if (snapshot.assignedUser?.includes("@")) {
    return snapshot.assignedUser;
  }

  return "Unassigned";
}

function formatSnapshot(snapshot: Snapshot | null, usersById: Map<string, string>) {
  if (!snapshot) {
    return "None";
  }

  return [
    `Name: ${snapshot.name ?? "N/A"}`,
    `Location: ${snapshot.location ?? "N/A"}`,
    `GPS: ${snapshot.latitude ?? "N/A"}, ${snapshot.longitude ?? "N/A"}`,
    `Capacity: ${snapshot.capacityGrams ?? "N/A"} g`,
    `Clean status: ${snapshot.cleanStatus ?? "N/A"}`,
    `Fill status: ${snapshot.fillStatus ?? "N/A"}`,
    `Assigned user: ${assignedUserEmail(snapshot, usersById)}`,
    `Latest fill: ${snapshot.latestFillPercent ?? "N/A"}%`,
    `Latest weight: ${snapshot.latestWeightGrams ?? "N/A"} g`,
    `Notes: ${snapshot.notes || "None"}`
  ].join("\n");
}

function addPageIfNeeded(doc: PDFKit.PDFDocument, neededHeight = 120) {
  if (doc.y + neededHeight > doc.page.height - 48) {
    doc.addPage();
  }
}

async function buildPdfBuffer(): Promise<Buffer> {
  const entries = await prisma.feederHistory.findMany({
    orderBy: {
      changedAt: "desc"
    },
    include: {
      changedByUser: true
    }
  });
  const snapshots = entries.flatMap((entry) => [
    parseSnapshot(entry.beforeJson),
    parseSnapshot(entry.afterJson)
  ]);
  const assignedUserIds = Array.from(
    new Set(
      snapshots
        .map((snapshot) => snapshot?.assignedUserId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const assignedUsers = assignedUserIds.length
    ? await prisma.user.findMany({
        where: {
          id: {
            in: assignedUserIds
          }
        },
        select: {
          id: true,
          email: true
        }
      })
    : [];
  const usersById = new Map(
    assignedUsers.flatMap((user) => (user.email ? [[user.id, user.email]] : []))
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(22).fillColor("#173f35").text("Bird Feeder Edit History");
    doc
      .moveDown(0.4)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#4c635b")
      .text(`Generated ${formatDate(new Date())}`)
      .text(`${entries.length} history ${entries.length === 1 ? "entry" : "entries"}`);
    doc.moveDown();

    if (entries.length === 0) {
      doc.fontSize(12).fillColor("#173f35").text("No feeder edits have been recorded yet.");
      doc.end();
      return;
    }

    entries.forEach((entry, index) => {
      addPageIfNeeded(doc, 180);

      const before = snapshots[index * 2];
      const after = snapshots[index * 2 + 1];
      const changedBy = entry.changedByUser?.name ?? entry.changedByUser?.email ?? "Unknown user";

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#173f35")
        .text(`${index + 1}. ${entry.action} - ${entry.feederName}`, { continued: false });
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#4c635b")
        .text(`${formatDate(entry.changedAt)} by ${changedBy}`)
        .text(entry.summary);
      doc.moveDown(0.4);

      if (entry.action === "UPDATE") {
        doc.fontSize(10).fillColor("#173f35").text("Before", { underline: true });
        doc.fontSize(9).fillColor("#253f37").text(formatSnapshot(before, usersById));
        doc.moveDown(0.35);
        doc.fontSize(10).fillColor("#173f35").text("After", { underline: true });
        doc.fontSize(9).fillColor("#253f37").text(formatSnapshot(after, usersById));
      } else {
        doc.fontSize(10).fillColor("#173f35").text(entry.action === "DELETE" ? "Deleted feeder" : "Created feeder", {
          underline: true
        });
        doc.fontSize(9).fillColor("#253f37").text(formatSnapshot(after ?? before, usersById));
      }

      doc.moveDown(1);
    });

    doc.end();
  });
}

export async function GET() {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const pdf = await buildPdfBuffer();

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="feeder-edit-history.pdf"',
      "Cache-Control": "no-store"
    }
  });
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type UserOption = {
  id: string;
  name: string | null;
  email: string | null;
};

type FeederOption = {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  capacityGrams: number;
  notes: string;
  cleanStatus: string;
  fillStatus: string;
  assignedUserId: string | null;
  assignedUser: UserOption | null;
  measurements: Array<{
    fillPercent: number;
    weightGrams: number;
  }>;
};

type FeederManagementProps = {
  feeders: FeederOption[];
  users: UserOption[];
};

const cleanStatuses = [
  { value: "CLEAN", label: "Clean" },
  { value: "NEEDS_CLEANING", label: "Needs cleaning" }
];

const fillStatuses = [
  { value: "FILLED", label: "Filled" },
  { value: "LOW", label: "Low" },
  { value: "EMPTY", label: "Empty" }
];

export function FeederManagement({ feeders, users }: FeederManagementProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function saveFeeder(event: FormEvent<HTMLFormElement>, feederId?: string) {
    event.preventDefault();
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      location: String(formData.get("location") ?? ""),
      latitude: Number(formData.get("latitude")),
      longitude: Number(formData.get("longitude")),
      capacityGrams: Number(formData.get("capacityGrams")),
      notes: String(formData.get("notes") ?? ""),
      cleanStatus: String(formData.get("cleanStatus") ?? ""),
      fillStatus: String(formData.get("fillStatus") ?? ""),
      assignedUserId: String(formData.get("assignedUserId") ?? ""),
      fillPercent: Number(formData.get("fillPercent")),
      weightGrams: Number(formData.get("weightGrams"))
    };

    const response = await fetch(feederId ? `/api/feeders/${feederId}` : "/api/feeders", {
      method: feederId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error ?? "Could not save feeder.");
      return;
    }

    setEditingId(null);
    if (!feederId) {
      form.reset();
    }
    router.refresh();
  }

  async function deleteFeeder(feederId: string) {
    setMessage("");

    const confirmed = window.confirm("Remove this feeder and its related readings?");

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/feeders/${feederId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error ?? "Could not remove feeder.");
      return;
    }

    router.refresh();
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-bold text-canopy">Manage Feeders</h2>
        <p className="mt-1 text-sm text-canopy/60">Add stations, update GPS location, assign work, and track clean/fill status.</p>
      </div>

      {message ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{message}</p> : null}

      <div className="rounded-3xl bg-canopy/5 p-4">
        <h3 className="font-bold text-canopy">Add feeder</h3>
        <FeederForm users={users} onSubmit={saveFeeder} />
      </div>

      <div className="space-y-3">
        {feeders.map((feeder) => (
          <div key={feeder.id} className="rounded-3xl border border-canopy/10 p-4">
            {editingId === feeder.id ? (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-canopy">Edit {feeder.name}</h3>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-sm font-bold text-canopy/60 hover:text-canopy"
                  >
                    Cancel
                  </button>
                </div>
                <FeederForm feeder={feeder} users={users} onSubmit={(event) => saveFeeder(event, feeder.id)} />
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-bold text-canopy">{feeder.name}</p>
                  <p className="text-sm text-canopy/60">
                    {feeder.latitude}, {feeder.longitude} - assigned to{" "}
                    {feeder.assignedUser?.name ?? feeder.assignedUser?.email ?? "Unassigned"}
                  </p>
                  <p className="mt-2 text-sm font-medium text-canopy">
                    {formatStatus(feeder.cleanStatus)} / {formatStatus(feeder.fillStatus)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(feeder.id)}
                    className="rounded-full bg-canopy px-4 py-2 text-sm font-bold text-white hover:bg-moss"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFeeder(feeder.id)}
                    className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FeederForm({
  feeder,
  users,
  onSubmit
}: {
  feeder?: FeederOption;
  users: UserOption[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const measurement = feeder?.measurements[0];

  return (
    <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmit}>
      <TextField name="name" label="Name" defaultValue={feeder?.name} />
      <TextField name="location" label="Location label" defaultValue={feeder?.location} />
      <NumberField name="latitude" label="Latitude" step="0.000001" defaultValue={feeder?.latitude ?? ""} />
      <NumberField name="longitude" label="Longitude" step="0.000001" defaultValue={feeder?.longitude ?? ""} />
      <NumberField name="capacityGrams" label="Capacity (g)" step="1" defaultValue={feeder?.capacityGrams ?? 1000} />
      <NumberField name="fillPercent" label="Fill percent" step="1" defaultValue={measurement?.fillPercent ?? 100} />
      <NumberField name="weightGrams" label="Weight (g)" step="1" defaultValue={measurement?.weightGrams ?? 0} />
      <label className="text-sm font-bold text-canopy">
        Assigned user
        <select
          name="assignedUserId"
          required
          defaultValue={feeder?.assignedUserId ?? users[0]?.id ?? ""}
          className="mt-2 w-full rounded-2xl border border-canopy/15 bg-white px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ?? user.email}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-canopy">
        Clean status
        <select
          name="cleanStatus"
          defaultValue={feeder?.cleanStatus ?? "CLEAN"}
          className="mt-2 w-full rounded-2xl border border-canopy/15 bg-white px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
        >
          {cleanStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-canopy">
        Fill status
        <select
          name="fillStatus"
          defaultValue={feeder?.fillStatus ?? "FILLED"}
          className="mt-2 w-full rounded-2xl border border-canopy/15 bg-white px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
        >
          {fillStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-canopy md:col-span-2 xl:col-span-4">
        Notes
        <textarea
          name="notes"
          defaultValue={feeder?.notes ?? ""}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
          placeholder="Access notes, refill instructions, or maintenance context"
        />
      </label>
      <div className="flex items-end md:col-span-2 xl:col-span-2">
        <button type="submit" className="w-full rounded-2xl bg-canopy px-4 py-3 font-bold text-white hover:bg-moss">
          {feeder ? "Save feeder" : "Add feeder"}
        </button>
      </div>
    </form>
  );
}

function TextField({
  name,
  label,
  defaultValue
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="text-sm font-bold text-canopy">
      {label}
      <input
        name={name}
        required
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
      />
    </label>
  );
}

function NumberField({
  name,
  label,
  step,
  defaultValue
}: {
  name: string;
  label: string;
  step: string;
  defaultValue: number | string;
}) {
  return (
    <label className="text-sm font-bold text-canopy">
      {label}
      <input
        name={name}
        type="number"
        required
        step={step}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
      />
    </label>
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

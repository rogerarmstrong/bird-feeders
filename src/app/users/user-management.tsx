"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type FeederOption = {
  id: string;
  name: string;
  location: string;
  assignedUserId: string | null;
};

type ManagedUser = {
  id: string;
  name: string | null;
  email: string | null;
  assignedFeeders: Array<{
    id: string;
    name: string;
    location: string;
  }>;
};

type UserManagementProps = {
  users: ManagedUser[];
  feeders: FeederOption[];
  currentUserId: string;
};

export function UserManagement({ users, feeders, currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function saveUser(event: FormEvent<HTMLFormElement>, userId?: string) {
    event.preventDefault();
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      feederIds: formData.getAll("feederIds").map(String)
    };

    const response = await fetch(userId ? `/api/users/${userId}` : "/api/users", {
      method: userId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error ?? "Could not save user.");
      return;
    }

    setEditingId(null);
    if (!userId) {
      form.reset();
    }
    router.refresh();
  }

  async function deleteUser(userId: string) {
    setMessage("");

    const confirmed = window.confirm("Remove this user and unassign their feeders?");

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/users/${userId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error ?? "Could not remove user.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      {message ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{message}</p> : null}

      <section className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-canopy">Add User</h2>
        <p className="mt-1 text-sm text-canopy/60">
          Create a user and optionally assign feeders they should clean and fill.
        </p>
        <UserForm feeders={feeders} onSubmit={saveUser} />
      </section>

      <section className="rounded-[2rem] border border-canopy/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-canopy">Manage Users</h2>
        <div className="mt-5 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-3xl border border-canopy/10 p-4">
              {editingId === user.id ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-bold text-canopy">Edit {user.name ?? user.email}</h3>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-sm font-bold text-canopy/60 hover:text-canopy"
                    >
                      Cancel
                    </button>
                  </div>
                  <UserForm user={user} feeders={feeders} onSubmit={(event) => saveUser(event, user.id)} />
                </div>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-canopy">{user.name ?? "Unnamed user"}</p>
                    <p className="text-sm text-canopy/60">{user.email}</p>
                    <p className="mt-2 text-sm font-medium text-canopy">
                      {user.assignedFeeders.length} assigned feeder{user.assignedFeeders.length === 1 ? "" : "s"}
                    </p>
                    {user.assignedFeeders.length > 0 ? (
                      <p className="mt-1 text-sm text-canopy/60">
                        {user.assignedFeeders.map((feeder) => feeder.name).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(user.id)}
                      className="rounded-full bg-canopy px-4 py-2 text-sm font-bold text-white hover:bg-moss"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={user.id === currentUserId}
                      onClick={() => deleteUser(user.id)}
                      className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
}

function UserForm({
  user,
  feeders,
  onSubmit
}: {
  user?: ManagedUser;
  feeders: FeederOption[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const assignedFeederIds = new Set(user?.assignedFeeders.map((feeder) => feeder.id) ?? []);

  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm font-bold text-canopy">
          Name
          <input
            name="name"
            required
            defaultValue={user?.name ?? ""}
            className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
        <label className="text-sm font-bold text-canopy">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue={user?.email ?? ""}
            className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
        <label className="text-sm font-bold text-canopy">
          {user ? "New password (optional)" : "Password"}
          <input
            name="password"
            type="password"
            required={!user}
            minLength={8}
            className="mt-2 w-full rounded-2xl border border-canopy/15 px-4 py-3 font-normal outline-none focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
      </div>

      <fieldset className="rounded-3xl bg-canopy/5 p-4">
        <legend className="text-sm font-bold text-canopy">Assigned feeders</legend>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {feeders.map((feeder) => (
            <label key={feeder.id} className="flex items-start gap-3 rounded-2xl bg-white p-3 text-sm text-canopy">
              <input
                name="feederIds"
                type="checkbox"
                value={feeder.id}
                defaultChecked={assignedFeederIds.has(feeder.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-bold">{feeder.name}</span>
                <span className="block text-canopy/60">{feeder.location}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="rounded-2xl bg-canopy px-5 py-3 font-bold text-white hover:bg-moss">
        {user ? "Save user" : "Add user"}
      </button>
    </form>
  );
}

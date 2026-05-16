import { UserManagement } from "@/app/users/user-management";
import { getFeeders, getManagedUsers } from "@/lib/monitoring";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireSession();
  const [users, feeders] = await Promise.all([getManagedUsers(), getFeeders()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-moss">Team</p>
        <h1 className="mt-2 text-3xl font-black text-canopy sm:text-4xl">Users</h1>
        <p className="mt-3 max-w-2xl text-canopy/65">
          Add people, update account details, remove users, and assign feeders for cleaning and filling.
        </p>
      </div>

      <UserManagement users={users} feeders={feeders} currentUserId={session.user.id} />
    </div>
  );
}

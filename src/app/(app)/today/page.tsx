import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Today</h1>
        <SignOutButton />
      </div>
      <p className="mt-2 text-sm text-zinc-500">Signed in as {user?.email}</p>
      <p className="mt-8 text-zinc-500">
        Placeholder — real Today screen (calendar, top tasks, domain status)
        comes next.
      </p>
    </div>
  );
}

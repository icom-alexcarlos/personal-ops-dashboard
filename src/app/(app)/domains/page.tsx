import { createClient } from "@/lib/supabase/server";
import { createDomain, updateDomain, toggleDomainActive } from "./actions";

export default async function DomainsPage() {
  const supabase = await createClient();
  const { data: domains } = await supabase
    .from("stewardship_domains")
    .select("*")
    .order("is_system", { ascending: false })
    .order("name");

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Domains</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Top-level life/work areas. Inbox is the system default for unsorted tasks.
      </p>

      <div className="mt-6 space-y-4">
        {domains?.map((domain) => (
          <form
            key={domain.id}
            action={updateDomain}
            className={`rounded border p-4 ${domain.active ? "" : "opacity-50"}`}
          >
            <input type="hidden" name="id" value={domain.id} />
            <input type="hidden" name="active" value={String(domain.active)} />

            <div className="flex items-center gap-2">
              <input
                name="name"
                defaultValue={domain.name}
                disabled={domain.is_system}
                className="flex-1 rounded border px-2 py-1 font-medium disabled:border-none disabled:bg-transparent disabled:px-0"
              />
              {domain.is_system && (
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  system
                </span>
              )}
              {!domain.active && (
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  archived
                </span>
              )}
            </div>

            <textarea
              name="description"
              defaultValue={domain.description ?? ""}
              placeholder="Description"
              rows={2}
              className="mt-2 w-full rounded border px-2 py-1 text-sm"
            />

            <input
              name="expected_cadence"
              defaultValue={domain.expected_cadence ?? ""}
              placeholder="Expected cadence (e.g. daily, weekly)"
              className="mt-2 w-full rounded border px-2 py-1 text-sm"
            />

            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="rounded bg-black px-3 py-1 text-sm text-white"
              >
                Save
              </button>
              {!domain.is_system && (
                <button
                  type="submit"
                  formAction={toggleDomainActive}
                  className="rounded border px-3 py-1 text-sm"
                >
                  {domain.active ? "Archive" : "Restore"}
                </button>
              )}
            </div>
          </form>
        ))}
      </div>

      <form action={createDomain} className="mt-8 rounded border border-dashed p-4">
        <h2 className="font-medium">New domain</h2>
        <input
          name="name"
          placeholder="Name"
          required
          className="mt-2 w-full rounded border px-2 py-1"
        />
        <textarea
          name="description"
          placeholder="Description"
          rows={2}
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
        />
        <input
          name="expected_cadence"
          placeholder="Expected cadence (e.g. daily, weekly)"
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="mt-3 rounded bg-black px-3 py-1 text-sm text-white"
        >
          Add domain
        </button>
      </form>
    </div>
  );
}

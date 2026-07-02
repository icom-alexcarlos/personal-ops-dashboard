"use client";

export function MilestoneStatusSelect({ status }: { status: string }) {
  return (
    <select
      name="status"
      defaultValue={status}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded border px-2 py-1 text-sm"
    >
      <option value="pending">Pending</option>
      <option value="in_progress">In progress</option>
      <option value="done">Done</option>
    </select>
  );
}

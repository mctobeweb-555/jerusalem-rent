"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUS_LABELS } from "@/lib/utils";

export default function LeadStatusSelect({
  leadId,
  current,
}: {
  leadId: string;
  current: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    const previous = status;
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setStatus(previous); // rollback
      alert("Impossible de mettre à jour le statut.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="input py-1.5 text-sm disabled:opacity-60"
      value={status}
      disabled={saving}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Statut du lead"
    >
      {Object.entries(LEAD_STATUS_LABELS).map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

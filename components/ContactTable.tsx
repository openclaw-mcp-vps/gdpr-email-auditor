"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { format } from "date-fns";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ContactFinding } from "@/lib/gdpr-scanner";

type ContactTableProps = {
  contacts: ContactFinding[];
};

const riskColors: Record<string, string> = {
  compliant: "bg-[#123122] text-[#57e1aa] border-[#244536]",
  warning: "bg-[#33250f] text-[#f9c56d] border-[#4a3f1e]",
  critical: "bg-[#35131a] text-[#ff9da8] border-[#5f2730]"
};

export function ContactTable({ contacts }: ContactTableProps) {
  const [riskFilter, setRiskFilter] = useState<"all" | "compliant" | "warning" | "critical">("all");
  const [query, setQuery] = useState("");
  const [activeContact, setActiveContact] = useState<ContactFinding | null>(null);

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesRisk = riskFilter === "all" || contact.riskLevel === riskFilter;
      const haystack = `${contact.email} ${contact.reasons.join(" ")}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      return matchesRisk && matchesQuery;
    });
  }, [contacts, query, riskFilter]);

  return (
    <section className="space-y-4 rounded-2xl border border-[#253549] bg-[#111a24]/85 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[var(--font-heading)] text-xl font-semibold">Contact Findings</h2>
        <div className="text-sm text-[#8ea2bd]">Showing {filtered.length.toLocaleString()} of {contacts.length.toLocaleString()} contacts</div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <label className="flex items-center gap-2 rounded-xl border border-[#2f4157] bg-[#0f1621] px-3 py-2 text-sm text-[#c7d7ea]">
          <Search className="h-4 w-4 text-[#8ea2bd]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email or issue..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#6f849e]"
          />
        </label>

        <Select.Root value={riskFilter} onValueChange={(value) => setRiskFilter(value as typeof riskFilter)}>
          <Select.Trigger className="inline-flex items-center justify-between rounded-xl border border-[#2f4157] bg-[#0f1621] px-3 py-2 text-sm text-[#c7d7ea]">
            <Select.Value placeholder="Risk filter" />
            <Select.Icon>
              <ChevronDown className="h-4 w-4 text-[#8ea2bd]" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 overflow-hidden rounded-xl border border-[#304560] bg-[#111b28] shadow-lg">
              <Select.Viewport className="p-1">
                {[
                  { value: "all", label: "All levels" },
                  { value: "critical", label: "Critical" },
                  { value: "warning", label: "Warning" },
                  { value: "compliant", label: "Compliant" }
                ].map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="relative flex cursor-pointer select-none items-center rounded-lg px-8 py-2 text-sm text-[#d4e1ef] outline-none focus:bg-[#1a2a3d]"
                  >
                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                      <Check className="h-4 w-4" />
                    </Select.ItemIndicator>
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#283a50]">
        <table className="min-w-full divide-y divide-[#243549] text-left text-sm">
          <thead className="bg-[#0f1621] text-[#8ea2bd]">
            <tr>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Risk</th>
              <th className="px-3 py-3 font-medium">Consent Date</th>
              <th className="px-3 py-3 font-medium">Source</th>
              <th className="px-3 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2c3d] bg-[#111a24]">
            {filtered.map((contact) => (
              <tr key={`${contact.rowNumber}-${contact.email}`} className="hover:bg-[#162235]">
                <td className="px-3 py-3 text-[#dce8f5]">{contact.email || "(missing email)"}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-semibold capitalize ${riskColors[contact.riskLevel]}`}>
                    {contact.riskLevel}
                  </span>
                </td>
                <td className="px-3 py-3 text-[#b8cae0]">
                  {contact.consentDate ? format(new Date(contact.consentDate), "yyyy-MM-dd") : "Missing"}
                </td>
                <td className="px-3 py-3 text-[#b8cae0]">{contact.consentSource ?? "Missing"}</td>
                <td className="px-3 py-3">
                  <Dialog.Root open={activeContact?.rowNumber === contact.rowNumber} onOpenChange={(open) => setActiveContact(open ? contact : null)}>
                    <Dialog.Trigger asChild>
                      <button
                        type="button"
                        className="rounded-lg border border-[#33506b] bg-[#162638] px-3 py-1.5 text-xs font-medium text-[#c8daee] transition hover:bg-[#1c3249]"
                      >
                        View details
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
                      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#304763] bg-[#0f1621] p-6 shadow-2xl">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <Dialog.Title className="font-[var(--font-heading)] text-xl font-semibold text-[#e7edf5]">
                              Contact compliance detail
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm text-[#8ea2bd]">
                              Row {contact.rowNumber} • {contact.email || "Missing email"}
                            </Dialog.Description>
                          </div>
                          <Dialog.Close asChild>
                            <button type="button" className="rounded-md border border-[#36506f] p-1 text-[#9fb4cd] hover:bg-[#19283a]">
                              <X className="h-4 w-4" />
                            </button>
                          </Dialog.Close>
                        </div>

                        <div className="space-y-3 text-sm text-[#d1deed]">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-[#8ea2bd]">Why flagged</p>
                            <ul className="mt-2 space-y-2">
                              {contact.reasons.map((reason) => (
                                <li key={reason} className="rounded-lg border border-[#2a3d53] bg-[#152233] px-3 py-2">
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-lg border border-[#2a3d53] bg-[#152233] p-3">
                            <p className="text-xs uppercase tracking-wide text-[#8ea2bd]">Suggested remediation</p>
                            <p className="mt-1">{contact.recommendation}</p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-[#2a3d53] bg-[#152233] p-3">
                              <p className="text-xs uppercase tracking-wide text-[#8ea2bd]">Double opt-in</p>
                              <p className="mt-1">{contact.doubleOptIn === null ? "Unknown" : contact.doubleOptIn ? "Confirmed" : "Not confirmed"}</p>
                            </div>
                            <div className="rounded-lg border border-[#2a3d53] bg-[#152233] p-3">
                              <p className="text-xs uppercase tracking-wide text-[#8ea2bd]">Proof reference</p>
                              <p className="mt-1 break-all">{contact.consentProof ?? "Missing"}</p>
                            </div>
                          </div>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Trash2, Loader2 } from "lucide-react";

type LeadStatus = "NEW" | "CONTACTED" | "CLOSED";

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  answers: unknown;
  status: string;
  created_at: string;
  result_style: { name_en: string } | null;
  result_package: { name_en: string; price_from: number; price_to: number; currency: string } | null;
}

interface LeadTableProps {
  leads: LeadData[];
}

const statusOptions: LeadStatus[] = ["NEW", "CONTACTED", "CLOSED"];

const statusColors: Record<LeadStatus, string> = {
  NEW: "bg-accent-muted text-accent",
  CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CLOSED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatPrice(from: number, to: number, currency: string): string {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return `${fmt.format(from)} - ${fmt.format(to)}`;
}

export function LeadTable({ leads }: LeadTableProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "ALL">("ALL");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const filteredLeads =
    filterStatus === "ALL"
      ? leads
      : leads.filter((lead) => lead.status === filterStatus);

  function handleToggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    setPendingAction(`status-${leadId}`);
    try {
      await api(`/api/admin/leads/${leadId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(leadId: string) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setPendingAction(`delete-${leadId}`);
    try {
      await api(`/api/admin/leads/${leadId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setPendingAction(null);
      setExpandedId(null);
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["ALL", ...statusOptions] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filterStatus === status
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            }`}
          >
            {status === "ALL" ? "All" : status}
            {status !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({leads.filter((l) => l.status === status).length})
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-sm text-text-muted">
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <p className="text-text-muted text-sm py-12 text-center">
          No leads match the current filter.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-text-secondary w-8" />
                <th className="text-left py-3 px-2 font-medium text-text-secondary">
                  Name
                </th>
                <th className="text-left py-3 px-2 font-medium text-text-secondary">
                  Email
                </th>
                <th className="text-left py-3 px-2 font-medium text-text-secondary hidden md:table-cell">
                  Style
                </th>
                <th className="text-left py-3 px-2 font-medium text-text-secondary">
                  Status
                </th>
                <th className="text-left py-3 px-2 font-medium text-text-secondary hidden sm:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const isExpanded = expandedId === lead.id;
                const isPending = pendingAction?.includes(lead.id) ?? false;
                return (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isExpanded={isExpanded}
                    isPending={isPending}
                    pendingAction={pendingAction}
                    onToggleExpand={() => handleToggleExpand(lead.id)}
                    onStatusChange={(status) =>
                      handleStatusChange(lead.id, status)
                    }
                    onDelete={() => handleDelete(lead.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface LeadRowProps {
  lead: LeadData;
  isExpanded: boolean;
  isPending: boolean;
  pendingAction: string | null;
  onToggleExpand: () => void;
  onStatusChange: (status: LeadStatus) => void;
  onDelete: () => void;
}

function LeadRow({
  lead,
  isExpanded,
  isPending,
  pendingAction,
  onToggleExpand,
  onStatusChange,
  onDelete,
}: LeadRowProps) {
  const answers = lead.answers as Record<string, string> | null;

  return (
    <>
      <tr
        className="border-b border-border-light last:border-0 cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
        onClick={onToggleExpand}
      >
        <td className="py-3 px-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </td>
        <td className="py-3 px-2 text-text-primary font-medium">
          {lead.name}
        </td>
        <td className="py-3 px-2 text-text-secondary">{lead.email}</td>
        <td className="py-3 px-2 text-text-secondary hidden md:table-cell">
          {lead.result_style?.name_en ?? "N/A"}
        </td>
        <td className="py-3 px-2">
          <Badge className={statusColors[lead.status as LeadStatus]} variant="default">
            {lead.status}
          </Badge>
        </td>
        <td className="py-3 px-2 text-text-muted hidden sm:table-cell">
          {formatDate(lead.created_at)}
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr className="bg-bg-tertiary/30">
          <td colSpan={6} className="px-4 py-4">
            <Card className="border-border-light">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact info */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">
                      Contact Information
                    </h4>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-text-muted">Name</dt>
                        <dd className="text-text-primary">{lead.name}</dd>
                      </div>
                      <div>
                        <dt className="text-text-muted">Email</dt>
                        <dd className="text-text-primary">
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-accent hover:text-accent-hover"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.email}
                          </a>
                        </dd>
                      </div>
                      {lead.phone && (
                        <div>
                          <dt className="text-text-muted">Phone</dt>
                          <dd className="text-text-primary">{lead.phone}</dd>
                        </div>
                      )}
                      {lead.message && (
                        <div>
                          <dt className="text-text-muted">Message</dt>
                          <dd className="text-text-primary whitespace-pre-wrap">
                            {lead.message}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Quiz results */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">
                      Quiz Results
                    </h4>
                    <dl className="space-y-2 text-sm">
                      {lead.result_style && (
                        <div>
                          <dt className="text-text-muted">
                            Recommended Style
                          </dt>
                          <dd className="text-text-primary">
                            {lead.result_style.name_en}
                          </dd>
                        </div>
                      )}
                      {lead.result_package && (
                        <div>
                          <dt className="text-text-muted">Package</dt>
                          <dd className="text-text-primary">
                            {lead.result_package.name_en}
                            <span className="ml-2 text-text-muted">
                              (
                              {formatPrice(
                                lead.result_package.price_from,
                                lead.result_package.price_to,
                                lead.result_package.currency,
                              )}
                              )
                            </span>
                          </dd>
                        </div>
                      )}
                    </dl>

                    {/* Quiz answers */}
                    {answers && Object.keys(answers).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-text-primary mb-2">
                          Quiz Answers
                        </h4>
                        <dl className="space-y-1.5 text-sm">
                          {Object.entries(answers).map(([question, answer]) => (
                            <div key={question}>
                              <dt className="text-text-muted">{question}</dt>
                              <dd className="text-text-primary">{answer}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-light flex-wrap">
                  <span className="text-sm text-text-muted mr-1">
                    Set status:
                  </span>
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={lead.status === status ? "accent" : "outline"}
                      size="sm"
                      disabled={isPending || lead.status === status}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(status);
                      }}
                    >
                      {isPending &&
                      pendingAction === `status-${lead.id}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : null}
                      {status}
                    </Button>
                  ))}

                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      {isPending &&
                      pendingAction === `delete-${lead.id}` ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </td>
        </tr>
      )}
    </>
  );
}

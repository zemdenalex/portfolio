import { cookies } from "next/headers";
import { serverApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, FolderOpen, Package } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DashboardStats = {
  total_leads: number;
  new_leads: number;
  published_projects: number;
  active_packages: number;
};

type LeadItem = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  result_style?: { name_en: string } | null;
  result_package?: { name_en: string } | null;
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

const statusColors: Record<string, string> = {
  NEW: "bg-accent-muted text-accent",
  CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CLOSED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let dashStats: DashboardStats = {
    total_leads: 0,
    new_leads: 0,
    published_projects: 0,
    active_packages: 0,
  };
  let recentLeads: LeadItem[] = [];

  try {
    [dashStats, recentLeads] = await Promise.all([
      serverApi<DashboardStats>("/api/admin/leads/stats", cookieHeader),
      serverApi<LeadItem[]>("/api/admin/leads?limit=10", cookieHeader),
    ]);
  } catch {
    // API unavailable
  }

  const stats = [
    {
      label: "Total Leads",
      value: dashStats.total_leads,
      icon: Users,
      href: "/admin/leads",
    },
    {
      label: "New Leads",
      value: dashStats.new_leads,
      icon: UserPlus,
      href: "/admin/leads",
    },
    {
      label: "Published Projects",
      value: dashStats.published_projects,
      icon: FolderOpen,
      href: "/admin/portfolio",
    },
    {
      label: "Active Packages",
      value: dashStats.active_packages,
      icon: Package,
      href: "/admin/packages",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:border-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-text-secondary">
                    {stat.label}
                  </CardTitle>
                  <Icon className="w-5 h-5 text-text-muted" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent leads table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Link
            href="/admin/leads"
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">
              No leads yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
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
                  {recentLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border-light last:border-0"
                    >
                      <td className="py-3 px-2 text-text-primary font-medium">
                        {lead.name}
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        {lead.email}
                      </td>
                      <td className="py-3 px-2 text-text-secondary hidden md:table-cell">
                        {lead.result_style?.name_en ?? "N/A"}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={statusColors[lead.status] ?? ""}
                          variant="default"
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-text-muted hidden sm:table-cell">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

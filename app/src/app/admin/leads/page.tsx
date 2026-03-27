import { cookies } from "next/headers";
import { serverApi } from "@/lib/api";
import { LeadTable } from "@/components/admin/lead-table";

export const dynamic = "force-dynamic";

type LeadData = {
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
};

export default async function LeadsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let leads: LeadData[] = [];
  try {
    leads = await serverApi<LeadData[]>("/api/admin/leads", cookieHeader);
  } catch {
    // API unavailable
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Leads</h1>
      <LeadTable leads={leads} />
    </div>
  );
}

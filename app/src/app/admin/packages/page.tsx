import { cookies } from "next/headers";
import { serverApi } from "@/lib/api";
import { PackagesList } from "@/components/admin/package-form";

export const dynamic = "force-dynamic";

type PackageData = {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  project_type: string;
  description_en: string;
  description_ru: string;
  price_from: number;
  price_to: number;
  currency: string;
  features_en: string[];
  features_ru: string[];
  delivery_days: number | null;
  sort_order: number;
  active: boolean;
};

export default async function PackagesAdminPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let packages: PackageData[] = [];
  try {
    packages = await serverApi<PackageData[]>("/api/admin/packages", cookieHeader);
  } catch {
    // API unavailable
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Service Packages</h1>
      <PackagesList packages={packages} />
    </div>
  );
}

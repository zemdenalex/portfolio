import { cookies } from "next/headers";
import { serverApi } from "@/lib/api";
import { StylesList } from "@/components/admin/style-editor";

export const dynamic = "force-dynamic";

type StyleRefData = {
  id: string;
  url: string;
  label_en: string;
  label_ru: string;
  type: string;
  sort_order: number;
};

type StyleData = {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  references: StyleRefData[];
};

export default async function StylesAdminPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let styles: StyleData[] = [];
  try {
    styles = await serverApi<StyleData[]>("/api/admin/styles", cookieHeader);
  } catch {
    // API unavailable
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quiz Styles</h1>
      <StylesList styles={styles} />
    </div>
  );
}

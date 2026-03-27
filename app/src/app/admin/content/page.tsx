import { cookies } from "next/headers";
import { serverApi } from "@/lib/api";
import { ContentEditor } from "@/components/admin/content-editor";

export const dynamic = "force-dynamic";

type ContentEntry = {
  id: string;
  key: string;
  value_en: string;
  value_ru: string;
};

export default async function ContentAdminPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let entries: ContentEntry[] = [];
  try {
    entries = await serverApi<ContentEntry[]>("/api/admin/content", cookieHeader);
  } catch {
    // API unavailable
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Site Content</h1>
      <ContentEditor entries={entries} />
    </div>
  );
}

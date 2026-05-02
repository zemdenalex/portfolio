import { cookies } from "next/headers";
import { serverApi } from "@/lib/api";
import { QuizTreeEditor } from "@/components/admin/quiz-tree-editor";

export const dynamic = "force-dynamic";

type QuizOptionData = {
  id: string;
  node_id: string;
  label_en: string;
  label_ru: string;
  next_node_id: string | null;
  sort_order: number;
  style_weights: Record<string, number> | null;
  project_type: string | null;
};

type QuizResultData = {
  id: string;
  style_id: string;
  package_id: string;
  description_en: string | null;
  description_ru: string | null;
};

type QuizNodeData = {
  id: string;
  parent_id: string | null;
  type: string;
  question_en: string | null;
  question_ru: string | null;
  sort_order: number;
  options: QuizOptionData[];
  result: QuizResultData | null;
  children: QuizNodeData[];
};

type StyleOption = { id: string; name_en: string };
type PackageOption = { id: string; name_en: string };

type QuizTreeResponse = {
  nodes: QuizNodeData[];
  styles: StyleOption[];
  packages: PackageOption[];
};

export default async function QuizAdminPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let data: QuizTreeResponse = { nodes: [], styles: [], packages: [] };
  try {
    data = await serverApi<QuizTreeResponse>("/api/admin/quiz/tree", cookieHeader);
  } catch {
    // API unavailable
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quiz Tree Editor</h1>
      <QuizTreeEditor
        nodes={data.nodes}
        styles={data.styles}
        packages={data.packages}
      />
    </div>
  );
}

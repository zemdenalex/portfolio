const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";
const SERVER_API_URL = process.env.API_URL || API_URL;

type ApiResponse<T> = {
  data: T;
  error?: { code: string; message: string };
};

export async function api<T>(
  path: string,
  options?: RequestInit & { server?: boolean },
): Promise<T> {
  const baseUrl = options?.server ? SERVER_API_URL : API_URL;
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `API error: ${res.status}`);
  }

  return json.data;
}

export type QuizResultData = {
  style: {
    id: string;
    slug: string;
    name_en: string;
    name_ru: string;
    description_en: string;
    description_ru: string;
  };
  references: Array<{
    id: string;
    style_id: string;
    url: string;
    label_en: string;
    label_ru: string;
    type: string;
    sort_order: number;
    screenshot_url: string | null;
    embeddable: boolean;
  }>;
  package: {
    id: string;
    slug: string;
    name_en: string;
    name_ru: string;
    project_type: string;
    description_en: string;
    description_ru: string;
    price_from: number;
    price_to: number;
  } | null;
};

export async function postQuizResult(optionIds: string[]): Promise<QuizResultData> {
  return api<QuizResultData>("/api/public/quiz/result", {
    method: "POST",
    body: JSON.stringify({ option_ids: optionIds }),
  });
}

// Server-side helper that forwards cookies from the incoming request
export async function serverApi<T>(
  path: string,
  cookieHeader?: string | null,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  return api<T>(path, {
    ...options,
    server: true,
    headers,
  });
}

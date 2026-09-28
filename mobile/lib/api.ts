import type {
  Category,
  IdeaImagePayload,
  IdeaSummary,
  ItemDetail,
  ItemSummary,
  Leaderboard,
  LogResult,
  ProfileSnapshot,
  SavedProfile,
  SubmissionResult,
} from "@/lib/types";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://recycler-api.fly.dev").replace(/\/$/, "");

export function absoluteApiUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Could not reach the Recycler API. Start the server and try again.");
  }

  const text = await response.text();
  let data: { error?: string } = {};
  if (text) {
    try {
      data = JSON.parse(text) as { error?: string };
    } catch {
      throw new ApiError(response.status, "The API returned something unexpected.");
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, data.error || "Something went wrong.");
  }
  return data as T;
}

export const api = {
  categories: () => request<{ categories: Category[] }>("/categories"),
  items: (params: { q?: string; category?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.category) search.set("category", params.category);
    const query = search.toString();
    return request<{ items: ItemSummary[] }>(`/items${query ? `?${query}` : ""}`);
  },
  item: (id: string) => request<ItemDetail>(`/items/${encodeURIComponent(id)}`),
  ideas: (params: { kind?: string; limit?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.kind) search.set("kind", params.kind);
    if (params.limit) search.set("limit", String(params.limit));
    const query = search.toString();
    return request<{ ideas: IdeaSummary[] }>(`/ideas${query ? `?${query}` : ""}`);
  },
  saveProfile: (id: string, displayName: string) =>
    request<SavedProfile>(`/profiles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ displayName }),
    }),
  profile: (id: string) => request<ProfileSnapshot>(`/profiles/${encodeURIComponent(id)}`),
  leaderboard: (profileId?: string) =>
    request<Leaderboard>(`/leaderboard${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ""}`),
  log: (body: { profileId: string; itemId: string; action: "reuse" | "dispose"; ideaId?: string; method?: string }) =>
    request<LogResult>("/logs", { method: "POST", body: JSON.stringify(body) }),
  submit: (body: {
    profileId: string;
    category: string;
    itemName: string;
    ideaKind: string;
    title: string;
    materials: string;
    steps: string;
    disposalNote?: string;
    image?: IdeaImagePayload;
    itemImage?: IdeaImagePayload;
  }) => request<SubmissionResult>("/submissions", { method: "POST", body: JSON.stringify(body) }),
};

// ============================================================
// Fetch wrapper — baseURL from EXPO_PUBLIC_API_URL env var
// Default: http://localhost:8000  (Section 17 / .env.example)
// ============================================================

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Generic API error with status code. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }
  // 204 No Content
  if (response.status === 204) return undefined as unknown as T;
  return response.json() as Promise<T>;
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  };
}

export const api = {
  /** HTTP GET */
  get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: buildHeaders(headers),
    }).then((r) => handleResponse<T>(r));
  },

  /** HTTP POST with JSON body */
  post<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r));
  },

  /** HTTP PUT with JSON body */
  put<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r));
  },

  /** HTTP DELETE */
  delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: buildHeaders(headers),
    }).then((r) => handleResponse<T>(r));
  },

  /** Multipart POST for file/image upload (used by /scan/photo). */
  postFormData<T>(path: string, formData: FormData): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type manually — fetch sets the correct multipart boundary.
    }).then((r) => handleResponse<T>(r));
  },
};

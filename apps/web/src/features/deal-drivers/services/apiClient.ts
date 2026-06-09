const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function apiCall<T>(
  endpoint: string,
  fallback: T,
  options?: RequestInit & { params?: Record<string, any> }
): Promise<T> {
  let url = `${BASE}${endpoint}`;
  if (options?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) {
          val.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, String(val));
        }
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const method = options?.method || 'GET';
  let bodyPayload: any = undefined;
  if (options?.body && typeof options.body === 'string') {
    try {
      bodyPayload = JSON.parse(options.body);
    } catch {
      bodyPayload = options.body;
    }
  }

  if (bodyPayload !== undefined) {
    console.log(`[API CALL] Sending ${method} request to: ${url}`, { body: bodyPayload });
  } else {
    console.log(`[API CALL] Sending ${method} request to: ${url}`);
  }

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    console.log(`[API CALL] Success response from: ${url}`, data);
    return data;
  } catch (err) {
    console.warn(`[MOCK FALLBACK] Using mock data for ${url} due to error:`, err);
    return fallback;
  }
}


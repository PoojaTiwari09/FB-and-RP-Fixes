/** Unwrap M01 bridge responses (`{ data }`, list envelopes, or raw body). */
export function unwrapM01Payload<T>(json: Record<string, unknown>): T {
  if (json.error) {
    throw new Error(String(json.error));
  }
  if (json.data !== undefined) {
    return json.data as T;
  }
  if (Array.isArray(json.calls) && json.totalCount !== undefined) {
    const total = Number(json.totalCount);
    const page = Number(json.page ?? 1);
    const size = Number(json.size ?? 20);
    return {
      calls: json.calls,
      totalCount: total,
      page,
      size,
    } as T;
  }
  return json as T;
}

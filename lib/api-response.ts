/** A preview HTML error page should never bubble up as a raw JSON syntax error. */
export async function readApiJSON<T>(response: Response, unavailableMessage: string): Promise<T> {
 if(!(response.headers.get("content-type")||"").toLowerCase().includes("application/json"))
  throw new Error(unavailableMessage + " (HTTP " + response.status + ")");
 try { return await response.json() as T; }
 catch { throw new Error(unavailableMessage + " (HTTP " + response.status + ")"); }
}

/**
 * Web-only auth flow debug. In __DEV__, wraps fetch and logs auth-related
 * requests/responses so we can see credentials, status, and CORS/cookie headers.
 *
 * Call installWebAuthDebug() once at app load (e.g. root layout).
 */

const AUTH_PATH = "/api/auth";

function isAuthRequest(url: string): boolean {
  try {
    return new URL(url, "https://x").pathname.includes(AUTH_PATH);
  } catch {
    return String(url).includes(AUTH_PATH);
  }
}

function getHeaderMap(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export function installWebAuthDebug(): void {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;

  const originalFetch = window.fetch;
  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
    const isAuth = isAuthRequest(url);

    if (!isAuth) {
      return originalFetch.call(window, input, init);
    }

    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")) as string;
    const credentials = init?.credentials ?? (input instanceof Request ? input.credentials : undefined);

    const start = Date.now();
    return originalFetch.call(window, input, init).then((response) => {
      const ms = Date.now() - start;
      const resHeaders = getHeaderMap(response.headers);

      const debug: Record<string, unknown> = {
        tag: "[auth-debug]",
        method,
        url,
        credentials: credentials ?? "(default)",
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        ms,
        responseHeaders: resHeaders,
      };

      const setCookie = resHeaders["set-cookie"];
      if (setCookie === undefined) {
        debug.setCookieVisible = false;
        debug.note = "Set-Cookie not visible (cross-origin or not set)";
      } else {
        debug.setCookieVisible = true;
        debug.setCookieLength = setCookie?.length ?? 0;
      }

      const acOrigin = resHeaders["access-control-allow-origin"];
      const acCreds = resHeaders["access-control-allow-credentials"];
      debug.corsOrigin = acOrigin ?? "(none)";
      debug.corsCredentials = acCreds ?? "(none)";

      console.log("[auth-debug] request", { method, url, credentials: credentials ?? "(default)" });
      console.log("[auth-debug] response", debug);

      return response;
    });
  };
}

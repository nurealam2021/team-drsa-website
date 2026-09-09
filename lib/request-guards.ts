import "server-only";

export function requestBodyTooLarge(
  request: Request,
  maxBytes: number
) {
  const value = request.headers.get("content-length");

  if (!value) return false;

  const length = Number(value);

  return Number.isFinite(length) && length > maxBytes;
}

export function sameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");

  // Requests without an Origin header are allowed.
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);

    /*
     * When Next.js runs behind Nginx, request.url normally
     * contains the internal upstream address (127.0.0.1:3000).
     *
     * The browser, however, uses the public host such as
     * 192.168.22.253.
     *
     * Therefore trust the forwarded host/protocol supplied
     * by our Nginx reverse proxy.
     */
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();

    const host =
      forwardedHost ||
      request.headers.get("host")?.trim();

    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim()
      .toLowerCase();

    const requestUrl = new URL(request.url);

    const protocol =
      forwardedProto ||
      requestUrl.protocol.replace(":", "").toLowerCase();

    if (!host) {
      return false;
    }

    const originProtocol = originUrl.protocol
      .replace(":", "")
      .toLowerCase();

    return (
      originUrl.host.toLowerCase() === host.toLowerCase() &&
      originProtocol === protocol
    );
  } catch {
    return false;
  }
}

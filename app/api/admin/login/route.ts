import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  authenticateAdmin,
  createAdminSession,
  writeAudit,
} from "@/lib/auth";
import {
  requestBodyTooLarge,
  sameOriginRequest,
} from "@/lib/request-guards";

const attempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function loginKey(request: Request, email: string) {
  const forwarded =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() || "unknown";

  return `${forwarded}:${email}`;
}

function blocked(key: string) {
  const now = Date.now();

  if (attempts.size > 5000) {
    for (const [entryKey, value] of attempts) {
      if (value.resetAt < now) {
        attempts.delete(entryKey);
      }
    }
  }

  const value = attempts.get(key);

  if (!value || value.resetAt < now) {
    attempts.set(key, {
      count: 1,
      resetAt: now + 15 * 60 * 1000,
    });

    return false;
  }

  value.count += 1;

  return value.count > 10;
}

function requestIsHttps(request: Request) {
  const forwardedProto =
    request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim()
      .toLowerCase();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid request origin.",
      },
      { status: 403 }
    );
  }

  if (requestBodyTooLarge(request, 8192)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Login request is too large.",
      },
      { status: 413 }
    );
  }

  const body = (await request
    .json()
    .catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email =
    body.email?.trim().toLowerCase() || "";

  if (!email || !body.password) {
    return NextResponse.json(
      {
        ok: false,
        message: "Email and password are required.",
      },
      { status: 400 }
    );
  }

  const key = loginKey(request, email);

  if (blocked(key)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Too many login attempts. Please wait 15 minutes.",
      },
      { status: 429 }
    );
  }

  try {
    const user = await authenticateAdmin(
      email,
      body.password
    );

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Successful authentication clears the rate limiter.
    attempts.delete(key);

    const { token, expires } =
      await createAdminSession(user);

    await writeAudit(
      user,
      "admin.login",
      "admin-session"
    );

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    /*
     * IMPORTANT:
     *
     * Do NOT blindly use:
     *
     * secure: process.env.NODE_ENV === "production"
     *
     * because production can temporarily run over HTTP
     * on a private IP during deployment/testing.
     *
     * Once HTTPS is enabled through Nginx,
     * X-Forwarded-Proto becomes https and Secure is
     * automatically enabled.
     */
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: requestIsHttps(request),
      path: "/",
      expires,
    });

    response.headers.set(
      "Cache-Control",
      "no-store, max-age=0"
    );

    return response;
  } catch (error) {
    console.error(
      "[Team DRSA Admin Login]",
      error instanceof Error
        ? error.message
        : "Authentication initialization failed."
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Admin authentication is not initialized correctly. Check the server configuration.",
      },
      { status: 500 }
    );
  }
}

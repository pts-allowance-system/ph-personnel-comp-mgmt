import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { UserRole } from "@/lib/models";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Define access control rules
const accessControl: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/hr": ["hr", "admin"],
  "/finance": ["finance", "admin"],
  "/supervisor": ["supervisor", "admin"],
  "/requests": ["employee", "supervisor", "hr", "finance", "admin"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Allow public routes
  // Allow public routes, including the login API endpoint
  if (['/login', '/not-authorized', '/api/auth/login'].includes(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication failed: No token provided' }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as UserRole;

    // Find the most specific path prefix that matches the request path
    const requiredRoles = Object.keys(accessControl)
      .filter(path => pathname.startsWith(path))
      .sort((a, b) => b.length - a.length) // Sort by length to get most specific match
      .map(path => accessControl[path])[0];

    if (requiredRoles && !requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/not-authorized", request.url));
    }

    // Add user info to the request headers so it can be accessed in server components
    const requestHeaders = new Headers(request.headers);
    const userPayload = {
      id: payload.id as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      role: userRole,
      nationalId: payload.nationalId as string,
      department: payload.department as string,
      position: payload.position as string,
    };
    const encodedUser = Buffer.from(JSON.stringify(userPayload)).toString('base64');
    requestHeaders.set('x-user', encodedUser);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (err) {
    console.error("JWT Verification Error:", err);
    // Clear the invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("auth-token", "", { expires: new Date(0) });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 
     * This new matcher INCLUDES /api routes.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

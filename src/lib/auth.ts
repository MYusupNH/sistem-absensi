
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type UserRole =
  | "admin"
  | "super_admin"
  | "school"
  | "student";

export type SessionUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  schoolId: number | null;
};

const COOKIE_NAME = "siprak_session";

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET minimal 32 karakter.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());

    const allowedRoles: UserRole[] = [
      "admin",
      "super_admin",
      "school",
      "student",
    ];

    if (
      typeof payload.id !== "number" ||
      typeof payload.fullName !== "string" ||
      typeof payload.email !== "string" ||
      !allowedRoles.includes(payload.role as UserRole)
    ) {
      return null;
    }

    return {
      id: payload.id,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role as UserRole,
      schoolId:
        typeof payload.schoolId === "number"
          ? payload.schoolId
          : null,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireRole(
  role: UserRole | UserRole[]
) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(session.role)) {
    return null;
  }

  return session;
}

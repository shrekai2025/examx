import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export type UserRole = "admin" | "user";

export interface SessionData {
  username: string;
  role: UserRole;
  isLoggedIn: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "complex-password-at-least-32-characters-long",
  cookieName: "examx-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function login(username: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> {
  console.log("🔐 Login attempt started for username:", username);

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const userUsername = process.env.USER_USERNAME || "user";
  const userPassword = process.env.USER_PASSWORD || "user123";

  let role: UserRole | null = null;

  if (username === adminUsername && password === adminPassword) {
    role = "admin";
    console.log("✅ Admin credentials matched");
  } else if (username === userUsername && password === userPassword) {
    role = "user";
    console.log("✅ User credentials matched");
  }

  if (!role) {
    console.log("❌ Invalid credentials");
    return { success: false, error: "Invalid username or password" };
  }

  try {
    console.log("🍪 Getting session...");
    const session = await getSession();

    console.log("📝 Setting session data...");
    session.username = username;
    session.role = role;
    session.isLoggedIn = true;

    console.log("💾 Saving session...");
    await session.save();

    console.log("✅ Login successful!");
    return { success: true, role };
  } catch (error) {
    console.error("❌ Error during login:", error);
    return { success: false, error: "Failed to create session" };
  }
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function requireAuth(requiredRole?: UserRole): Promise<SessionData> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("Unauthorized");
  }

  if (requiredRole && session.role !== requiredRole) {
    throw new Error("Forbidden");
  }

  return session;
}

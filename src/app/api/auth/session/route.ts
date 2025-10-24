import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn || false,
      username: session.username || null,
      role: session.role || null,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

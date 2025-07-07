import { NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { User } from "@/lib/types";
import cache from "@/lib/cache";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const cacheKey = `profile:${id}`;
  try {
    const cachedUser = cache.get<Pick<User, 'id' | 'position' | 'department'>>(cacheKey);
    if (cachedUser) {
      return NextResponse.json(cachedUser);
    }

    const user = await Database.queryOne<Pick<User, 'id' | 'position' | 'department'>>(
      "SELECT id, position, department FROM users WHERE id = ?",
      [id]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    cache.set(cacheKey, user);
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user profile for id=${id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

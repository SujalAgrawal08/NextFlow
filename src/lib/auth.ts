import { auth as clerkAuth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { db } from "./db";

export async function getAuth() {
  try {
    const result = await clerkAuth();
    if (result.userId) {
      return { userId: result.userId };
    }
  } catch (err) {
    // Fails downstream if Clerk is fundamentally missing
  }

  // Fallback for seamless local development
  if (process.env.NODE_ENV !== "production") {
    const devUserId = "user_dev_local_mock";
    await db.user.upsert({
      where: { clerkId: devUserId },
      update: {},
      create: { clerkId: devUserId, email: "local@dev.test" },
    });
    return { userId: devUserId };
  }

  return { userId: null };
}

export async function getCurrentUser() {
  try {
    const user = await clerkCurrentUser();
    if (user) return user;
  } catch (err) {}

  if (process.env.NODE_ENV !== "production") {
    return { emailAddresses: [{ emailAddress: "local@dev.test" }] } as any;
  }
  return null;
}

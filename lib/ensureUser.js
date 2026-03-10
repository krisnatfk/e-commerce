import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Ensures a User record exists in Prisma for the given Clerk userId.
 * If not found, fetches user data from Clerk API and creates the record.
 * Returns the user record.
 */
export async function ensureUserExists(userId) {
    if (!userId) throw new Error("userId is required");

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;

    // Fetch from Clerk and create in Prisma
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    user = await prisma.user.create({
        data: {
            id: clerkUser.id,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            image: clerkUser.imageUrl || "",
        },
    });

    return user;
}

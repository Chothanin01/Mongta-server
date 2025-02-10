import { prismadb } from "../lib/db";

export async function generateuserid(): Promise<number> {
    while (true) {
        const id = Math.floor((Date.now() + Math.random()) % 2147483647);
        const existingUser = await prismadb.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return id;
        }
    }
}

export async function generatescanid(): Promise<number> {
    while (true) {
        const id = Math.floor((Date.now() + Math.random()) % 2147483647);
        const existingUser = await prismadb.scan.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return id;
        }
    }
}
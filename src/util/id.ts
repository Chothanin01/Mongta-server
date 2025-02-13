import { prismadb } from "./db";

export async function generateuserid(): Promise<number> {
    while (true) {
        const id = Math.floor((Date.now() / Math.random()) % 2147483647);
        const existuser = await prismadb.user.findUnique({
            where: { id }
        });
        if (!existuser) {
            return id;
        }
    }
}

export async function generatescanid(): Promise<number> {
    while (true) {
        const id = Math.floor((Date.now() / Math.random()) % 2147483647);
        const existscan = await prismadb.scan.findUnique({
            where: { id }
        });
        if (!existscan) {
            return id;
        }
    }
}

export async function generatechatid(): Promise<number> {
    while (true) {
        const id = Math.floor((Date.now() / Math.random()) % 2147483647);
        const existchat = await prismadb.chat.findUnique({
            where: { id }
        });
        if (!existchat) {
            return id;
        }
    }
}
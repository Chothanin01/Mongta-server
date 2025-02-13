import { OAuth2Client } from 'google-auth-library';

export const google_client = [
    process.env.GOOGLE_CLIENT_ID_WEB,
    process.env.GOOGLE_CLIENT_ID_ANDROID,
    process.env.GOOGLE_CLIENT_ID_IOS    
].filter((id): id is string => Boolean(id))

if (google_client.length === 0) {
    throw new Error("Missing Google Client IDs in environment variables.");
}

export const client = new OAuth2Client(google_client[0]);
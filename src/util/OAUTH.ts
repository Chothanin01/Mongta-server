import { OAuth2Client } from 'google-auth-library';

export const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID_ANDRIOD
)
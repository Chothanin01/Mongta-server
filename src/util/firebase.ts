import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS!) as ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://mongta-66831.firebasestorage.app',
  projectId: 'mongta-66831',
});

const auth = admin.auth()
const bucket = admin.storage().bucket();

export { bucket, auth };
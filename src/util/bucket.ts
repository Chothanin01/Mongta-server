import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS!) as ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://mongta-66831.firebasestorage.app',
});

const bucket = admin.storage().bucket();

export { bucket };
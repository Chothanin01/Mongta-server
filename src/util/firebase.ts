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

const uploadfile = (fileBuffer: Buffer, fileMimeType: string, destinationPath: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
      const file = bucket.file(destinationPath);
      const stream = file.createWriteStream({
          metadata: { contentType: fileMimeType },
          resumable: false
      });

      stream.on('error', (err) => {
          reject(err);
      });

      stream.on('finish', async () => {
          try {
              // Make the file public
              await file.makePublic();
              
              // Get the public URL
              const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destinationPath)}?alt=media`;
              resolve(fileUrl);
          } catch (err) {
              reject(err);
          }
      });

      stream.end(fileBuffer);
  });
};

export { bucket, auth, uploadfile };
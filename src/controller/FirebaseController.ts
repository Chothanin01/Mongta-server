import { Request, Response } from 'express';
import multer from 'multer';
import { bucket } from '../util/firebase';

//Configure Multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });
//Initialize Firebase Admin SDK 
export const uploadmiddleware = upload.single('file');

export const multipleupload = multer({
  storage: multer.memoryStorage(),
}).fields([
  { name: 'right_eye', maxCount: 1 },
  { name: 'left_eye', maxCount: 1 },
  { name: 'ai_right', maxCount: 1 },
  { name: 'ai_left', maxCount: 1 }
]);
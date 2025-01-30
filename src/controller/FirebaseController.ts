import { Request, Response } from 'express';
import multer from 'multer';
import { bucket } from '../util/bucket';

//Configure Multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });
//Initialize Firebase Admin SDK 
export const uploadmiddleware = upload.single('file');

export const uploadtest = async (req: Request, res: Response) => {
  try {    
    const image = req.file;

    //Handle missing file
    if (!image) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded.',
      });
      return
    }
    const fileName = `test/${image.originalname}`;
    const file = bucket.file(fileName);

    //Create write stream to upload the file
    const stream = file.createWriteStream({
      metadata: { contentType: image.mimetype },
      resumable: false,
    });

    stream.on('error', (err) => {
      console.log(err)
      res.status(500).json({
        success: false,
        message: 'Failed to upload the image.',
      });
      return
    });

    stream.on('finish', async () => {
      //Make it public
      await file.makePublic();

      //Get file public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      //Response success
      res.status(201).json({
        success: true,
        image: publicUrl,
        message: 'Image uploaded successfully.',
      });
    });

    // Write the file to the stream
    stream.end(image.buffer);
  } catch (error) {
    //Response Error
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while uploading the file.',
      });
  }
};

export const getfile = async (req: Request, res: Response) => {
  try {
    const fileName = req.params.fileName;
    const file = bucket.file(fileName);

    //Hadnle file not exists
    const exists = await file.exists();
    if (!exists[0]) {
      res.status(404).json({ 
        success: false,
        message: 'File not found' 
    });
        return
    }

    //Get a signed URL
    const [url] = await file.getSignedUrl({
      action: 'read', 
      expires: '03-09-2491', 
    });

    //Response success
    res.status(200).send({
        image: url,
        success: true,
        message: "Sent image url successfully"
        });
  } catch (error) {
    //Response Error
    console.error('Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while getting image.',
    });
  }
};

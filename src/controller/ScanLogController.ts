import { Response, Request } from "express";
import { prismadb } from "../util/db";
import { bucket } from "../util/bucket";
import { generatescanid } from "../util/id";
import FormData from 'form-data';
import fetch from 'node-fetch';

export const scanlog = async (req: Request,res: Response) => {
    try {
        const { user_id } = req.params
        //Handle user not exist
        const user = await prismadb.user.findUnique({
            where: { id: parseInt(user_id) }
        })
        if (!user) {
            res.status(400).send({
                succes:  false,
                message: "User not found."
            })
            return
        }
        //Find user scan log
        const scanlog = await prismadb.scan.findMany({
            where: { user_id: parseInt(user_id) }
        })
        if (scanlog.length == 0) {
            res.status(200).send({
                scanlog,
                success: true,
                message: "User haven't have any scan log yet."
            })
            return
        }
        //Response success
        res.status(200).send({
            scanlog,
            success: true,
            message: "Scan log have been sent successfully."
        })
    } catch (error) {
        //Response error
        console.log(error);
        res.status(400).json({
            error,
            success: false,
            message: "An unexpected error occurred while fetching the chat log."
        })
    }
}

export const ophtha_scanlog = async (req: Request, res:Response) => {
    try {
        const { conversation_id } = req.params
        //Handle chat not exist
        const conversation = await prismadb.conversation.findUnique({
            where: { id:parseInt(conversation_id) },
            select: {
                user_id: true
            }
        })
        if (!conversation) {
            res.status(400).send({
                success: false,
                message: "Conversation did not exist."
            })
            return
        }
        //Find user scan log
        const scanlog = await prismadb.scan.findMany({
            where: { user_id:conversation.user_id }
        })
        if (scanlog.length == 0) {
            res.status(200).send({
                scanlog,
                success: true,
                message: "User haven't have any scan log yet."
            })
            return
        }
        //Response success
        res.status(200).send({
            scanlog,
            success: true,
            message: "Scan log have been sent to ophthamologist successfully."
        })

    } catch (error) {
        //Response error
        console.log(error);
        res.status(400).json({
            error,
            success: false,
            message: "An unexpected error occurred while fetching the chat log."
        })
    }
}

export const savescanlog = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user_id, line_right, line_left, va_right, va_left, near_description, 
                ai_right_image_base64, ai_left_image_base64, description, 
                pic_description, pic_left_description, pic_right_description } = req.body;
        
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        
        // Handle missing inputs
        if (!user_id || !line_right || !line_left || !va_right || !va_left || !near_description) {
            res.status(400).send({
                success: false,
                message: "Missing required inputs."
            });
            return;
        }

        let ai_analysis;
        
        if (files && files.right_eye && files.left_eye) {
            console.log("Sending files to FastAPI...");
            try {
                const formData = new FormData();
                formData.append('right_eye', files.right_eye[0].buffer, files.right_eye[0].originalname);
                formData.append('left_eye', files.left_eye[0].buffer, files.left_eye[0].originalname);
                formData.append('user_id', user_id);
                formData.append('line_right', line_right);
                formData.append('line_left', line_left);
                formData.append('va_right', va_right);
                formData.append('va_left', va_left);
                formData.append('near_description', near_description);
                
                const ai = await fetch('http://127.0.0.1:8000/api-ai/upload-eye-predict', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        ...formData.getHeaders()
                    }
                });

                if (!ai.ok) {
                    const errorText = await ai.text();
                    console.error("AI Server Error:", errorText);
                    res.status(500).json({ 
                        success: false, 
                        message: "AI processing error", 
                        error: errorText 
                    });
                    return;
                }
                
                ai_analysis = await ai.json();
                console.log("AI Analysis Keys:", Object.keys(ai_analysis || {}));
            } catch (error) {
                console.log(error);
                res.status(400).json({
                    error,
                    success: false,
                    message: "An unexpected error occurred while processing with AI."
                });
                return;
            }
        } else if (ai_right_image_base64 && ai_left_image_base64) {
            ai_analysis = {
                description: description,
                pic_description: pic_description,
                pic_left_description: pic_left_description,
                pic_right_description: pic_right_description,
                ai_right_image_base64: ai_right_image_base64,
                ai_left_image_base64: ai_left_image_base64
            };
        } else {
            res.status(400).send({
                success: false,
                message: "Missing required photos or AI analysis."
            });
            return;
        }

        //Process AI analysis
        let aiRightBuffer, aiLeftBuffer, leftBuffer, rightBuffer;
        

        if (ai_analysis.left_eye) {
            rightBuffer = Buffer.from(ai_analysis.right_eye, 'base64');
        }

        if (ai_analysis.right_eye) {
            leftBuffer = Buffer.from(ai_analysis.left_eye, 'base64');
        }

        if (ai_analysis.ai_right_image_base64) {
            aiRightBuffer = Buffer.from(ai_analysis.ai_right_image_base64, 'base64');
        }
        
        if (ai_analysis.ai_left_image_base64) {
            aiLeftBuffer = Buffer.from(ai_analysis.ai_left_image_base64, 'base64');
        }

        //Validate AI analysis
        const aiDescription = ai_analysis.description || description;
        const ai_Pic_Description = ai_analysis.pic_description || pic_description;
        const ai_Pic_Left = ai_analysis.pic_left_description || pic_left_description;
        const ai_Pic_Right = ai_analysis.pic_right_description || pic_right_description;

        //Handle missing AI analysis
        if (!user_id || !aiDescription || 
            !line_right || !line_left || !va_right || !va_left || !near_description || 
            !ai_Pic_Description || !ai_Pic_Left || !ai_Pic_Right) {
            res.status(400).send({
                success: false,
                message: "Missing required AI analysis."
            });
            return;
        }

        //Generate scanID
        const id = await generatescanid();

        //Initialize URLs object
        const urls: Record<string, string> = {};
        //Upload AI right eye image
        if (aiRightBuffer) {
            const timestamp = Date.now();
            const fileName = `scanlog/${user_id}/${id}/${timestamp}_ai_right.jpg`;
            const fileUpload = bucket.file(fileName);
            
            await new Promise<void>((resolve, reject) => {
                const stream = fileUpload.createWriteStream({
                    metadata: {
                        contentType: 'image/jpeg',
                        metadata: {
                            originalName: 'ai_right.jpg',
                            uploadedAt: timestamp
                        }
                    },
                    resumable: false
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
                
                stream.on('finish', async () => {
                    await fileUpload.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    urls['ai_right'] = publicUrl;
                    resolve();
                });
                
                stream.end(aiRightBuffer);
            });
        }
        
        //Upload AI left eye image
        if (aiLeftBuffer) {
            const timestamp = Date.now();
            const fileName = `scanlog/${user_id}/${id}/${timestamp}_ai_left.jpg`;
            const fileUpload = bucket.file(fileName);
            
            await new Promise<void>((resolve, reject) => {
                const stream = fileUpload.createWriteStream({
                    metadata: {
                        contentType: 'image/jpeg',
                        metadata: {
                            originalName: 'ai_left.jpg',
                            uploadedAt: timestamp
                        }
                    },
                    resumable: false
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
                
                stream.on('finish', async () => {
                    await fileUpload.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    urls['ai_left'] = publicUrl;
                    resolve();
                });
                
                stream.end(aiLeftBuffer);
            });
        }
        
        //Upload user-uploaded files
        if (files && typeof files === 'object') {
            for (const fieldName of Object.keys(files)) {
                if (files[fieldName] && files[fieldName].length > 0) {
                    const file = files[fieldName][0];
                    const timestamp = Date.now();
                    const fileName = `scanlog/${user_id}/${id}/${timestamp}_${file.originalname}`;
                    const fileUpload = bucket.file(fileName);
                    
                    // Upload file
                    await new Promise<void>((resolve, reject) => {
                        const stream = fileUpload.createWriteStream({
                            metadata: {
                                contentType: file.mimetype,
                                metadata: {
                                    originalName: file.originalname,
                                    uploadedAt: timestamp
                                }
                            },
                            resumable: false
                        });
                        
                        stream.on('error', (error) => {
                            reject(error);
                        });
                        
                        stream.on('finish', async () => {
                            await fileUpload.makePublic();
                            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                            urls[fieldName] = publicUrl;
                            resolve();
                        });
                        
                        stream.end(file.buffer);
                    });
                }
            }
        }

        //Generate date
        const date = new Date();

        //Check for all required URLs
        if (!urls.ai_right || !urls.ai_left) {
            res.status(400).send({
                success: false,
                message: "Failed to upload AI-processed images."
            });
            return;
        }

        if (!urls.right_eye) urls.right_eye = "";
        if (!urls.left_eye) urls.left_eye = "";
        
        //Save scan log 
        const scanlog = await prismadb.scan.create({
            data: {
                id,
                user_id: parseInt(user_id.toString()),
                description: aiDescription,
                va: {
                    line_right: line_right,
                    line_left: line_left,
                    va_right: va_right,
                    va_left: va_left,
                    description: near_description
                },
                photo: {
                    right_eye: urls.right_eye,
                    left_eye: urls.left_eye,
                    ai_right: urls.ai_right,
                    ai_left: urls.ai_left,
                    description: ai_Pic_Description
                },
                date
            }
        });
        
        //Response success
        res.status(200).send({
            scanlog,
            description_left: ai_Pic_Left,
            description_right: ai_Pic_Right,
            success: true,
            message: "Scan log saved successfully."
        });

    } catch (error) {
        console.log(error);
        res.status(400).json({
            error,
            success: false,
            message: "An unexpected error occurred while saving the scan log."
        });
    }
}
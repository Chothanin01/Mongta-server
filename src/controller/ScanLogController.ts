import { Response, Request } from "express";
import { prismadb } from "../util/db";
import { bucket } from "../util/bucket";
import { generatescanid } from "../util/id";

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

export const savescanlog = async (req: Request,res: Response) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const { user_id, description, line_right, line_left, va_right, va_left, near_description, pic_description } = req.body

        //Handle missing inputs
        if (!user_id || !description || 
            !line_right || !line_left || !va_right || !va_left || !near_description || !pic_description ) {
            res.status(400).send({
                success: false,
                message: "Missing required inputs."
            })
            return
        }
        if (!files || !files.right_eye || !files.left_eye || !files.ai_right || !files.ai_left ) {
            res.status(400).send({
                success: false,
                message: "Missing required photo."
            })
            return
        }
        //Handle user_id not user
        const check_ophtha = await prismadb.user.findFirst({
            where: { id: parseInt(user_id) },
            select: {
                is_opthamologist: true
            }
        })
        if (check_ophtha?.is_opthamologist) {
            res.status(404).send({
                success: false,
                message: "Ophthamologist can't save scan log."
            })
            return
        }
        //Generate id
        const id = await generatescanid()
        //Upload multiple photo to firebase
        const urls: Record<string, string> = {}
        for (const [fieldName, fileArray] of Object.entries(files)) {
            const file = fileArray[0];
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
        //Generate date
        const date = new Date
        //Save scan log to database
        const scanlog = await prismadb.scan.create({
            data: {
                id,
                user_id: parseInt(user_id),
                description,
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
                    description: pic_description
                },
                date
            }
        })
        //Response success
        res.status(200).send({
            scanlog,
            success: true,
            message: "Scan log saved successfully."
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

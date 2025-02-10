import { Response, Request } from "express";
import { prismadb } from "../lib/db";

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
        //Find scan log from databasxe
        const scan = await prismadb.scan.findMany({
            where: { user_id: parseInt(user_id) }
        })
        if (scan.length == 0) {
            res.status(200).send({
                scan,
                success: true,
                message: "User haven't have any scan log yet."
            })
            return
        }
        //Response success
        res.status(200).send({
            scan,
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

export const savescanlog = async (req: Request,res: Response) => {
    try {
        const { user_id, description, 
             line_right, line_left, va_right, va_left, near_dexcription,
             right_eye, left_eye, ai_right, ai_left, pic_description } = req.body
        //Handle missing inputs
        if (!user_id || !description || 
            !line_right || !line_left || !va_right || !va_left || !near_dexcription ||
            !right_eye || !left_eye || !ai_right || !ai_left || !pic_description
        ) {
            res.status(400).send({
                success: false,
                message: "Missing required inputs."
            })
            return
        }

        const date = new Date
        const scanlog = await prismadb.scan.create({
            data: {
                user_id,
                description,
                va: {
                    line_right: line_right,
                    line_left: line_left,
                    va_right: va_right,
                    va_left: va_left,
                    description: near_dexcription
                },
                photo: {
                    right_eye: right_eye,
                    left_eye: left_eye,
                    ai_right: ai_right,
                    ai_left: ai_left,
                    description: pic_description
                },
                date
            }
        })

        res.status(200).send({
            scanlog,
            success: true,
            message: "Scan log save successfully"
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
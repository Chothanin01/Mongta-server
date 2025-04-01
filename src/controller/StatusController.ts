import { Response } from "express";
import { AuthRequest } from "./MiddlewareController";
import { prismadb } from "../util/db";
import jwt from "jsonwebtoken"

export const online = async (req: AuthRequest, res:Response ) => {
    try {
        const authheader = req.headers.authorization
        
        //Handle token not found
        if (!authheader) {
            res.status(400).send({
                success: false,
                message: "Token not found."
            })
            return
        } 

        //Get token
        const token = authheader && authheader.split(" ")[1];

        //Handle wrong token
        if (!token) {
            res.status(400).send({
                success: false,
                message: "Invalid token format.",
            });
            return
            }

        //Decode token
        const decode:any = jwt.verify(token, process.env.JWT_SECRET as string);

        const user = await prismadb.user.findUnique({
            where: { id: Number(decode.user_id) },
            select: {
                id: true
            }
        })

        if (!user) {
            res.status(404).send({
                success: false,
                message: "User not found"
            })
        }

        await prismadb.user.update({
            where: { id: Number(decode.user_id )},
            data: {
                status: 'online'
            }
        })

        //Response Success
        res.status(200).send({
            success: true,
            message: "User have been online."
        })

    } catch (error) {
        //Response Error
        console.log(error);
        res.status(500).json({
            error,
            success: false,
            message: "An error occurred."
        })
    }
}

export const offline = async (req: AuthRequest, res:Response ) => {
    try {
        const authheader = req.headers.authorization
        
        //Handle token not found
        if (!authheader) {
            res.status(400).send({
                success: false,
                message: "Token not found."
            })
            return
        } 

        //Get token
        const token = authheader && authheader.split(" ")[1];

        //Handle wrong token
        if (!token) {
            res.status(400).send({
                success: false,
                message: "Invalid token format.",
            });
            return
            }

        //Decode token
        const decode:any = jwt.verify(token, process.env.JWT_SECRET as string);

        const user = await prismadb.user.findUnique({
            where: { id: Number(decode.user_id) },
            select: {
                id: true
            }
        })

        if (!user) {
            res.status(404).send({
                success: false,
                message: "User not found"
            })
        }

        await prismadb.user.update({
            where: { id: Number(decode.user_id )},
            data: {
                status: 'offline'
            }
        })

        //Response Success
        res.status(200).send({
            success: true,
            message: "User have been offline."
        })

    } catch (error) {
        //Response Error
        console.log(error);
        res.status(500).json({
            error,
            success: false,
            message: "An error occurred."
        })
    }
}
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prismadb } from "../util/db";

export interface AuthRequest extends Request {
    user?: any;
}

export const middleware = async (req: AuthRequest,res: Response, next: NextFunction) => {
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

        // Find user in database
        const user = await prismadb.user.findUnique({
            where: { id: Number(decode.user_id) },
            select: {
                id: true,
                username: true,
                first_name: true,
                last_name: true,
                status: true
            }
        });

        //Handle not found user
        if (!user) {
            res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
            return
        }

        //Handle user offline
        if (user.status === 'offline') {
            res.status(401).json({
                success: false,
                message: "User offline."
            })
            return
        }

        req.user = user;

        next()


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

export const signout = async (req: AuthRequest, res: Response) => {
    try {
        const authheader = req.headers.authorization;

        //Handle missing token
        if (!authheader) {
            res.status(400).json({
                success: false,
                message: "Token not found.",
            });
            return
        }

        const token = authheader.split(" ")[1];

        //Decode token
        const decode: any = jwt.verify(token, process.env.JWT_SECRET as string);

        //Update user status to "offline"
        await prismadb.user.update({
            where: { id: Number(decode.user_id) },
            data: {
                status: 'offline',
            },
        });
        //Response success
        res.status(200).json({
            success: true,
            message: "User signed out successfully.",
        });

    } catch (error) {
        //Response Error
        res.status(500).json({
            success: false,
            message: "An error occurred during signout.",
            error,
        });
    }
};

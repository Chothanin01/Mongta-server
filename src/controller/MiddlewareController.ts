import { Request, Response } from "express";
import { auth } from "../util/firebase";
import { prismadb } from "../lib/db";

export const middleware = async (req: Request,res: Response) => {
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
        const idtoken = authheader.split('Bearer ')[1];

        //Handle wrong token
        if (!idtoken) {
            res.status(400).send({
              success: false,
              message: "Invalid token format.",
            });
            return
          }

        //Decode token
        const decode = await auth.verifyIdToken(idtoken) 

        // Find user in database
        const user = await prismadb.user.findUnique({
            where: { id: Number(decode.uid) },
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

        //Change user status
        if (user.status !== 'active') {
            res.status(403).json({ 
                success: false, 
                message: 'Account is not active' 
            });
        }
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
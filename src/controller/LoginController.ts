import { Request, Response } from "express";
import { prismadb } from "../lib/db";
import { comparePassword } from "../util/bcrypt";
import { auth } from "../util/firebase";

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body

         //Handle missing inputs
        if (!username || !password) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        const user = await prismadb.user.findFirst({
            where: { username:username }
        })
        
        //Handle user not found
        if (!user) {
            res.status(400).send({
                success: false,
                message: "User not found."
            })
            return
        }

        //Compare password
        const compare = await comparePassword(password, user?.password as string)
        if (!compare) {
            res.status(400).send({
                success: false,
                message: "Password invalid."
            })
            return
        }

        const firebaseToken = await auth.createCustomToken(user.id.toString());

        res.status(200).send({
            user: {
                id: user.id,
                username: user.username,
            },
            token: firebaseToken,
            message: "Login successfully."
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
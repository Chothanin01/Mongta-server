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

export const googlelogin = async (req: Request,res: Response) => {
    try {
        const { idtoken } = req.body

        //Handle missing inputs
        if (!idtoken) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        const decodetoken = await auth.verifyIdToken(idtoken)
        console.log(decodetoken);
        
        //Find user
        const user = await prismadb.user.findFirst({
            where: {
                email: {
                    path: ["email"],
                    equals: decodetoken.email
                }
            }
        })
        //Already register
        if (user) {
            const token = await auth.createCustomToken(decodetoken.uid)
            res.status(200).send({
                isRegister: true,
                token,
                user,
                success: true,
                message: "Login with google success." 
            })
            return
        }
        //Not register
        res.status(200).send({
            isRegister: false,
            google: {
                email: decodetoken.email,
                picture: decodetoken.picture,
                uid: decodetoken.uid
            }
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

//Same as googlelogin
export const facebooklogin = async (req: Request,res: Response) => {
    try {
        const { idtoken } = req.body

        //Handle missing inputs
        if (!idtoken) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        const decodetoken = await auth.verifyIdToken(idtoken)

        //Find user
        const user = await prismadb.user.findFirst({
            where: {
                email: {
                    path: ["email"],
                    equals: decodetoken.email
                }
            }
        })
        //Already register
        if (user) {
            const token = await auth.createCustomToken(decodetoken.uid)
            res.status(200).send({
                isRegister: true,
                token,
                user,
                success: true,
                message: "Login with google success." 
            })
            return
        }
        //Not register
        res.status(200).send({
            isRegister: false,
            facebook: {
                email: decodetoken.email,
                picture: decodetoken.picture,
                uid: decodetoken.uid
            }
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
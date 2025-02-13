import { Request, Response } from "express";
import { prismadb } from "../lib/db";
import { comparePassword } from "../util/bcrypt";
import { auth } from "../util/firebase";
import { client } from "../util/OAUTH";
import axios from "axios";

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

        //Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: idtoken,
            audience: process.env.GOOGLE_CLIENT_ID_ANDRIOD
        })

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({
                success: false,
                message: "Invalid token payload."
            });
            return
        }

        //Find user
        const user = await prismadb.user.findFirst({
            where: {
                email: {
                    path: ["email"],
                    equals: payload.email
                }
            }
        })
        //Already register
        if (user) {
            const token = await auth.createCustomToken(payload.sub)
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
                email: payload.email,
                picture: payload.picture,
                sub: payload.sub
            },
            idtoken
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

export const facebooklogin = async (req: Request,res: Response) => {
    try {
        const { accesstoken } = req.body

        //Handle missing inputs
        if (!accesstoken) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        //Verify the Facebook token
        const fbResponse = await axios.get(
            `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accesstoken}`
        );

        const { facebookId, email, name, picture } = fbResponse.data
        if (!email) {
            res.status(400).json({
                success: false,
                message: "Email not provided by Facebook."
            })
            return
        }
        //Find user
        const user = await prismadb.user.findFirst({
            where: {
                email: {
                    path: ["email"],
                    equals: email
                }
            }
        })
        //Already register
        if (user) {
            const token = auth.createCustomToken(facebookId)
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
                email,
                picture,
                facebookId
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
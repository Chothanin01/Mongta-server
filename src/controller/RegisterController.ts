import { Request, Response } from "express";
import { client } from "../util/OAUTH"
import { hashPassword } from "../util/bcrypt";
import { prismadb } from "../util/db";
import { generateuserid } from "../util/id";
import { verifyOTP } from "../util/OTP";

export const register = async(req: Request,res: Response) => {
    try {
        const { otp, otp_ref, username, password, phonenumber, email, first_name, last_name, sex, dob , method} = req.body
        
        //Handle missing inputs
        if (!otp || !otp_ref || !username || !password || !phonenumber || !email || !first_name || !last_name || !sex || !dob ) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        //Make phonenumber and email into json
        let phonejson = {
            "phonenumber": phonenumber,
            "is_verified": false
        }
        let emailjson = {
            "email": email,
            "is_verified": false
        }

        //Verify OTP
        const verify = await verifyOTP(otp_ref, otp, email)
        if (verify !== "OTP verified.") {
            res.status(400).json({
                success: false,
                message: verify
            })
            return
        }
        emailjson = {
            "email": email,
            "is_verified": true
        }

        //Hash password
        const hash = await hashPassword(password)

        //Generate id
        const id = await generateuserid()

        //Handle exist user
        const exist_user = await prismadb.user.findFirst({
            where: {
                OR: [
                    { username },
                    {
                        phone: {
                            path: ["phonenumber"],
                            equals: phonenumber
                        }
                    },
                    {
                        email: {
                            path: ["email"],
                            equals: email
                        }
                    }
                ]
            }
        });
        if (exist_user) {
            res.status(404).send({
                success: false,
                message: "User already exists."
            })
            return
        }

        const user = await prismadb.user.create({
            data: {
                id,
                first_name,
                last_name,
                username,
                password: hash,
                sex,
                date_of_birth: new Date(dob),
                is_opthamologist: false,
                status: 'offline',
                phone: phonejson,
                email: emailjson,
                profile_picture: "https://firebasestorage.googleapis.com/v0/b/mongta-66831.firebasestorage.app/o/profile.jpg?alt=media&token=43c03659-4c2f-4212-8393-3238eacc403d"
            }
        })

        //Response success
        res.status(201).send({
            user,
            success: true,
            message: "Created user successfully."
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


export const googleregister = async (req: Request,res: Response) => {
    try {
        const { id_token, phonenumber, first_name, last_name, sex, dob, profile_picture } = req.body;
        
        //Handle missing inputs
        if (!id_token || !phonenumber || !first_name || !last_name || !sex || !dob) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs."
            })
            return
        }

        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID_ANDROID_AUDIENCE
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email || !payload.picture) {
            res.status(400).json({ 
                success: false, 
                message: "Invalid token." 
            });
            return
        }
        
        const email = payload.email
        const picture = payload.picture
        if (!email || !picture) {
            res.status(400).json({
                success: false,
                message: "Missing token value."
            })
            return
        }

        //Generate id
        const id = await generateuserid()

        //Make phonenumber and email into json
        const phonejson = {
            "phonenumber": phonenumber,
            "is_verified": false
        };
        const emailjson = {
            "email": email,
            "is_verified": true
        };

        //Handle exist user
        const exist_user = await prismadb.user.findFirst({
            where: {
                OR: [
                    {
                        phone: {
                            path: ["phonenumber"],
                            equals: phonenumber
                        }
                    },
                    {
                        email: {
                            path: ["email"],
                            equals: email
                        }
                    }
                ]
            }
        });
        if (exist_user) {
            res.status(404).json({
                success: false,
                message: "User already exists."
            })
            return
        }
        
        //Create user
        const user = await prismadb.user.create({
            data: {
                id,
                first_name,
                last_name,
                username: email?.split('@')[0] || '',
                password: '',
                sex,
                date_of_birth: new Date(dob),
                is_opthamologist: false,
                status: 'offline',
                phone: phonejson,
                email: emailjson,
                profile_picture: profile_picture || "https://firebasestorage.googleapis.com/v0/b/mongta-66831.firebasestorage.app/o/profile.jpg?alt=media&token=43c03659-4c2f-4212-8393-3238eacc403d"
            }
        })

        //Response success
        res.status(201).json({
            user,
            success: true,
            message: "Created user successfully."
        });
    } catch (error) {
        //Response Error
        console.log(error);
        res.status(500).json({
            error,
            success: false,
            message: "An error occurred."
        });
    }
}

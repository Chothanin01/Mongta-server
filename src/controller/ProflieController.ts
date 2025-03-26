import { Request, Response } from "express";
import { prismadb } from "../util/db";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./MiddlewareController";
import { comparePassword, hashPassword } from "../util/bcrypt";
import { bucket } from "../util/firebase";

export const getuser = async (req: AuthRequest,res: Response) => {
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
                email: true,
                phone: true,
                profile_picture: true
            }
        });

        if (!user) {
            res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
            return
        }

        //Response success
        res.status(200).send({
            user,
            success: true,
            message: "User have been sent successfully."
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

export const changePassword = async (req: AuthRequest,res: Response) => {
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

        const { old_password, new_password } = req.body;

        //Handle missing inputs
        if (!new_password) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }
        //Find old password
        const hashpassword = await prismadb.user.findUnique({
            where: { id: Number(decode.user_id) },
            select: {
                password: true
            }
        })

        //Compare password
        const check_password = await comparePassword(old_password, hashpassword?.password as string)
        if (!check_password) {
            res.status(400).send({
                success: false,
                message: "Password invalid."
            })
            return
        }

        const compare_password = await comparePassword(new_password, hashpassword?.password as string)
        if (compare_password) {
            res.status(400).json({
                success: false,
                message: "Password cannot be the same as the old password."
            })
            return
        }
        //Hash new password
        const password = await hashPassword(new_password)
        //Update password
        await prismadb.user.update({
            where: { id: Number(decode.user_id) },
            data: {
                password: password
            }
        })

        //Response success
        res.status(200).send({
            success: true,
            message: "Password changed successfully."
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

export const forgetPassword = async (req: AuthRequest,res: Response) => {
    try {
        const { email, new_password } = req.body;

        //Handle missing inputs
        if (!new_password || !email) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        //Find user in database
        const user = await prismadb.user.findFirst({
            where: { email: {
                path: ['email'],
                equals: email
            } },
            select: {
                id: true
            }
        })
        if (!user) {
            res.status(401).json({ 
                success: false, 
                message: 'User not found.' 
            });
            return
        }  

        //Hash new password
        const password = await hashPassword(new_password)

        //Update password
        await prismadb.user.update({
            where: { id: user?.id },
            data: {
                password: password
            }
        })

        //Response success
        res.status(200).send({
            success: true,
            message: "Password changed successfully."
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

export const changeprofilepicture = async (req: AuthRequest,res: Response) => {
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

        const new_profile_picture = req.file
        
        if (!new_profile_picture) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        const uploadFile = () => {
            return new Promise<string>((resolve, reject) => {
                const filename = `profile/${decode.user_id}/${Date.now()}-${req.file!.originalname}`
                const file = bucket.file(filename)
                const stream = file.createWriteStream({
                    metadata: { contentType: req.file!.mimetype },
                    resumable: false
                });

                stream.on('error', (err) => {
                    reject(err);
                });

                stream.on('finish', async () => {
                    try {
                        //Make the file public
                        await file.makePublic();
                        
                        //Get the public URL
                        const fileurl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;
                        resolve(fileurl);
                    } catch (err) {
                        reject(err);
                    }
                });

                stream.end(req.file!.buffer);
            });
        };
        //Upload new profile picture
        const profile_picture = await uploadFile()
        if (!profile_picture) {
            res.status(400).json({
                success: false,
                message: "Upload new profile picture failed."
            })
        }

        const old_profile_picture = await prismadb.user.findUnique({
            where: { id: Number(decode.user_id) },
            select: {
                profile_picture: true
            }
        })
        //Delete old profile picture
        if (old_profile_picture?.profile_picture != null && old_profile_picture?.profile_picture != "https://firebasestorage.googleapis.com/v0/b/mongta-66831.firebasestorage.app/o/profile%2Fprofile.jpg?alt=media&token=2925bbc2-209b-4c3a-af4f-1af990f4be42" && old_profile_picture?.profile_picture != "https://firebasestorage.googleapis.com/v0/b/mongta-66831.firebasestorage.app/o/profile.jpg?alt=media&token=43c03659-4c2f-4212-8393-3238eacc403d") {
            const old_file = bucket.file(old_profile_picture.profile_picture)
            await old_file.delete()
        }

        //Update profile picture
        await prismadb.user.update({
            where: { id: Number(decode.user_id) },
            data: {
                profile_picture
            }
        })

        //Response success
        res.status(200).send({
            success: true,
            message: "Profile picture changed successfully."
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

export const updateuser = async (req: AuthRequest,res: Response) => {
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

        //Find user in database
        const user = await prismadb.user.findUnique({
            where: { id: Number(decode.user_id) },
            select: {
                id: true,
            }
        })
        if (!user) {
            res.status(401).json({ 
                success: false, 
                message: 'User not found.' 
            });
            return
        }

        const { first_name, last_name, email } = req.body;

        //Handle missing inputs
        if (!first_name || !last_name || !email) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        const check_email = await prismadb.user.findFirst({
            where: { email: {
                path: ['email'],
                equals: email
            } },
            select: {
                id: true
            }
        })
        if (check_email && check_email.id !== Number(decode.user_id)) {
            res.status(400).json({
                success: false,
                message: "Email already exists."
            })
            return
        }

        //Update user
        await prismadb.user.update({
            where: { id: Number(decode.user_id) },
            data: {
                first_name,
                last_name,
                email
            }
        })

        //Response success
        res.status(200).send({
            success: true,
            message: "User info updated successfully."
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
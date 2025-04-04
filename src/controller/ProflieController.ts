import { Request, Response } from "express";
import { prismadb } from "../util/db";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./MiddlewareController";
import { comparePassword, hashPassword } from "../util/bcrypt";
import { bucket, uploadfile } from "../util/firebase";

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
                profile_picture: true,
                is_opthamologist: true,
                sex: true,
                date_of_birth: true
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

        const { username, first_name, last_name } = req.body;

        const new_profile_picture = req.file

        //Handle missing inputs
        if (!first_name || !last_name || !username) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }
        //Handle missing file
        if (!new_profile_picture) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }
        
        const filemime = new_profile_picture.mimetype
        const filebuffer = new_profile_picture.buffer
        const filename = `profile/${decode.user_id}/${Date.now()}-${new_profile_picture!.originalname}`
        
        //Upload new profile picture
        const profile_picture = await uploadfile(filebuffer, filemime, filename)
        
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
            const oldFilePath = old_profile_picture.profile_picture
            .replace("https://firebasestorage.googleapis.com/v0/b/mongta-66831.firebasestorage.app/o/", "")
            .split("?")[0];

            const decodedFilePath = decodeURIComponent(oldFilePath);

            const old_file = bucket.file(decodedFilePath);
            await old_file.delete().catch(err => {
                console.error("Error deleting old profile picture:", err);
            });
        }

        //Check username
        const check_username = await prismadb.user.findFirst({
            where: { username: username },
            select: {
                id: true,
                username: true
            }
        })

        if (check_username && check_username.id !== Number(decode.user_id)) {
            res.status(400).json({
                success: false,
                message: "Username already exists."
            })
            return
        }

        //Update user
        const update_user = await prismadb.user.update({
            where: { id: Number(decode.user_id) },
            data: {
                first_name,
                last_name,
                username,
                profile_picture,
            }
        })

        //Response success
        res.status(200).send({
            update_user,
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

export const usernotification = async (req: AuthRequest,res: Response) => {
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
                message: 'User not found' 
            });
            return
        }

        const scan_count = await prismadb.scan.count({
            where: {
                user_id: Number(decode.user_id),
            }
        })

        const chat = await prismadb.conversation.findMany({
            where: { user_id: Number(decode.user_id) },
            select: {
                id: true
            }
        })

        const chat_noti = await prismadb.chat.findMany({
            where: { conversation_id: {
                in: chat.map((item) => item.id)
            },
            AND:[ { 
                sender_id: {not: Number(decode.user_id)}
            },{
                status: 'delivered'
            }],},
            orderBy: {
                timestamp: "desc"
            },
            select: {
                User: {
                    select: {
                        first_name: true
                    }
                }
            }
        })

        const scan = await prismadb.scan.findFirst({
            where: { user_id: Number(decode.user_id) },
            orderBy: {
                date: "desc"
            },
            select: {
                id: true,
                date: true,
                va: true,
                photo: true
            },
            take: 1
        })
        if (!scan) {
            res.status(200).send({
                scan_count,
                chat_count: chat.length,
                chat_noti,
                scan,
                success: true,
                message: "User notification have been sent successfully."
            })
            return
        }

        const va = typeof scan.va === "string" ? JSON.parse(scan.va) : scan.va;
        const va_status = va.description.includes("ผิดปกติ") ? "เสี่ยง" : "ปกติ";
        const eye = typeof scan.photo === "string" ? JSON.parse(scan.photo) : scan.va;
        const eye_status = eye.description.includes("ผิดปกติ") ? "เสี่ยง" : "ปกติ";

        //Response success
        res.status(200).send({
            scan_count,
            chat_count: chat.length,
            chat_noti,
            scan: {
                id: scan.id,
                date: scan.date,
                va: va_status,
                eye: eye_status
            },
            success: true,
            message: "User notification have been sent successfully."
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

export const ophthnotification = async (req: AuthRequest,res: Response) => {
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
                is_opthamologist: true
            }
        })
        if (!user || user.is_opthamologist === false) {
            res.status(401).json({ 
                success: false, 
                message: 'User not found or User is not ophthamologist.' 
            });
            return
        }

        const chat = await prismadb.conversation.findMany({
            where: { ophthalmologist_id: Number(decode.user_id) },
            select: {
                id: true
            }
        })

        const chat_noti = await prismadb.chat.findMany({
            where: { conversation_id: {
                in: chat.map((item) => item.id)
            },
            AND: [{ 
                sender_id: {not: Number(decode.user_id)}
            }, {
                status: 'delivered'
            }
        ]},
            orderBy: {
                timestamp: "desc"
            },
            select: {
                User: {
                    select: {
                        first_name: true
                    }
                }
            }
        })

        //Response success
        res.status(200).send({
            chat_count: chat.length,
            chat_noti,
            success: true,
            message: "Ophthalmologist notification have been sent successfully."
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
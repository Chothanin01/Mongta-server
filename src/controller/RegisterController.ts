import { Request, Response } from "express";
import { auth } from "../util/firebase";
import { hashPassword } from "../util/bcrypt";
import { prismadb } from "../util/db";
import { generateuserid } from "../util/id";

export const register = async(req: Request,res: Response) => {
    try {
        const { username, password, phonenumber, email, first_name, last_name, sex, dob } = req.body
        
        //Handle missing inputs
        if (!username || !password || !phonenumber || !email || !first_name || !last_name || !sex || !dob) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        //Hash password
        const hash = await hashPassword(password)

        //Generate id
        const id = await generateuserid()

        //Make phonenumber and email into json
        const phonejson = {
            "phonenumber": phonenumber,
            "is_verified": false
        }
        const emailjson = {
            "email": email,
            "is_verified": false
        }

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

        let user =  {}
        try {
            //Create user in firebase
            const user_firebase = await auth.createUser({
                email,
                password,
                displayName: username
            })
            
            //Create user in database
            user = await prismadb.user.create({
                data: {
                    id,
                    first_name,
                    last_name,
                    username,
                    password: hash,
                    sex,
                    date_of_birth: new Date(dob),
                    is_opthamologist: false,
                    status: 'online',
                    phone: phonejson,
                    email: emailjson,
                    profile_picture: "https://firebasestorage.googleapis.com/v0/b/mongta-66831.firebasestorage.app/o/profile.jpg?alt=media&token=43c03659-4c2f-4212-8393-3238eacc403d"
                }
            })

        } catch (error) {
            //Handle create user failed
            console.log(error);
            const del = await auth.getUserByEmail(email)
            await auth.deleteUser(del.uid)
            res.status(500).json({
                error,
                success: false,
                message: "An error occurred while creating user."
            })
            return
        }  

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
        const { id_token, phonenumber, first_name, last_name, sex, dob } = req.body;
        
        //Handle missing inputs
        if (!id_token || !phonenumber || !first_name || !last_name || !sex || !dob) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs."
            })
            return
        }
        //Decode token
        const decodedToken = await auth.verifyIdToken(id_token);
        const email = decodedToken.email
        const picture = decodedToken.picture
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

        let user = {}
        try {
            //Create user in firebase
            const user_firebase = await auth.createUser({
                email,
                password: '',
                displayName: email?.split('@')[0] || ''
            })
            
            //Create user in database
            user = await prismadb.user.create({
                data: {
                    id,
                    first_name,
                    last_name,
                    username: email?.split('@')[0] || '',
                    password: '',
                    sex,
                    date_of_birth: new Date(dob),
                    is_opthamologist: false,
                    status: 'online',
                    phone: phonejson,
                    email: emailjson,
                    profile_picture: "https://firebasestorage.googleapis.com/v0/b/mongta-66831.firebasestorage.app/o/profile.jpg?alt=media&token=43c03659-4c2f-4212-8393-3238eacc403d"
                }
            })

        } catch (error) {
            //Handle create user failed
            console.log(error);
            const del = await auth.getUserByEmail(email)
            await auth.deleteUser(del.uid)
            res.status(500).json({
                error,
                success: false,
                message: "An error occurred while creating user."
            })
            return
        }  

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

//Same as google register
export const facebookregister = async (req: Request,res: Response) => {
    try {
        const { id_token, phonenumber, first_name, last_name, sex, dob } = req.body;
        
        //Handle missing inputs
        if (!id_token || !phonenumber || !first_name || !last_name || !sex || !dob) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs."
            })
            return
        }
        //Decode token
        const decodedToken = await auth.verifyIdToken(id_token);
        const email = decodedToken.email
        const picture = decodedToken.picture
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

        let user = {}
        try {
            //Create user in firebase
            const user_firebase = await auth.createUser({
                email,
                password: '',
                displayName: email?.split('@')[0] || ''
            })
            
            //Create user in database
            user = await prismadb.user.create({
                data: {
                    id,
                    first_name,
                    last_name,
                    username: email?.split('@')[0] || '',
                    password: '',
                    sex,
                    date_of_birth: new Date(dob),
                    is_opthamologist: false,
                    status: 'online',
                    phone: phonejson,
                    email: emailjson,
                    profile_picture: "https://firebasestorage.googleapis.com/v0/b/mongta-66831.firebasestorage.app/o/profile.jpg?alt=media&token=43c03659-4c2f-4212-8393-3238eacc403d"
                }
            })

        } catch (error) {
            //Handle create user failed
            console.log(error);
            const del = await auth.getUserByEmail(email)
            await auth.deleteUser(del.uid)
            res.status(500).json({
                error,
                success: false,
                message: "An error occurred while creating user."
            })
            return
        }  

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

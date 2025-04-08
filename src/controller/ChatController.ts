import { Response,Request } from "express";
import { prismadb } from "../util/db";
import { io } from '../index'
import { generatechatid } from "../util/id";
import { uploadfile } from "../util/firebase";

export const findophth = async (req: Request, res: Response) =>  {
    try {
        const { user_id, sex } = req.body
        //Handle missing inputs.
        if (!user_id || !sex) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs."
            })
            return
        }

        //Handle user_id is not user
        const check_user = await prismadb.user.findUnique({
            where: {
                id: user_id
            },
            select: {
                is_opthamologist: true
            }
        })
        if (check_user?.is_opthamologist == true) {
            res.status(409).send({
                success: false,
                message: "Ophthamologist cannot create chat."
            })
            return
        }

        const check_chat = await prismadb.conversation.findMany({
            where: {
                user_id:user_id,
            }
        })
        
        const exist_chat = check_chat.map((chat) => chat.ophthalmologist_id)
        
        const ophth_condition:any = {
            is_opthamologist: true,
            status: "online",
            id: { notIn: exist_chat }
        }

        if ( sex && sex !== "both" ) {
            ophth_condition.sex = sex
        }


        const all_opht = await prismadb.user.findMany({
            where: ophth_condition,
            select: { 
                id: true,
                is_opthamologist: true
             } 
        })

        //Handle no ophthamologist
        if (all_opht.length === 0) {
            res.status(404).send({
                success: false,
                message: "No ophthamologist available."
            })
            return
        }

        const random_opht = Math.floor(Math.random() * all_opht.length)
        const opht = all_opht[random_opht]

        //Generate chat id
        const id = await generatechatid()

        //Create chat
        const create = await prismadb.conversation.create({
            data: {
                id,
                user_id,
                ophthalmologist_id:opht.id
            }
        })

        io.emit('joinRoom', { 
            conversation_id: create.id, 
            user_id, 
            ophthalmologist_id: opht.id 
        });

        //Send message that chat is create
        io.emit('newChat', { user_id, ophth: opht.id, conversation_id: create.id });
        
        //Response success
        res.status(201).send({
            create,
            success: true,
            message: "Chat created successfully."
        })

    } catch (error) {
        //Response Error
        console.log(error);
        res.status(500).json({ 
            error,
            success: false,
            message: "An error occurred while creating the chat." 
        })     
    }
}

export const sendchat = async (req:Request, res:Response) => {
    try {
        let { conversation_id, sender_id, message} = req.body
        
        conversation_id = parseInt(conversation_id)
        sender_id = parseInt(sender_id)

        //Handle missing inputs.
        if (!conversation_id || !sender_id || (!message && !req.file)) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }

        if (req.file && message) {
            res.status(404).send({
                success: false,
                message: "Can't send message and image together."
            })
            return
        }

        //Handle chat not create and sender not in this chat
        const check_chat = await prismadb.conversation.findFirst({
          where: {
            id: conversation_id
          },
          select: {
            user_id: true,
            ophthalmologist_id: true
          }  
        })
        if (check_chat?.ophthalmologist_id !== sender_id && check_chat?.user_id !== sender_id) {
            res.status(404).send({
                success: false,
                message: "You are not authorized to send in this chat."
            })
            return
        }

        //Create timestamp
        const now = new Date()
        const timeZoneOffset = 7 * 60
        const timestamp = new Date(now.getTime() + timeZoneOffset * 60000)
        
        let content:string

        if (req.file) {
            try {
                const filename = `chat/${conversation_id}/${Date.now()}-${req.file.originalname}`;
                const fileBuffer = req.file.buffer;
                const fileMimeType = req.file.mimetype;

                content = await uploadfile(fileBuffer, fileMimeType, filename);
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to upload the image.",
                });
                return
            }
        } else {
            content = message;
        }

        // Save message to database
        const chatMessage = await prismadb.chat.create({
            data: {
                sender_id,
                conversation_id,
                status: "delivered",
                timestamp,
                chat: content,
            },
        });

        //Send message
        io.to(conversation_id).emit('newMessage', {
            sender_id,
            message: content,
            timestamp,
            conversation_id
        });

        //Response success
        res.status(201).send({
            chatMessage,
            success: true,
            message: "Message sent successfully."
        })
    } catch (error) {
        //Response Error
        console.log(error);
        res.status(500).json({
            error,
            success: false,
            message: "An error occurred while sending the message."
        })
    }
}

export const chatlog = async (req:Request, res:Response) => {
    try {
        const { conversation_id, user_id } = req.params

        //Handle chat not exist
        const check_chat = await prismadb.conversation.findMany({
            where: {
                id:parseInt(conversation_id)
            }
        })
        if (check_chat.length <= 0) {
            res.status(404).json({
                success: false,
                message: "Chat did not exist."
            })
            return
        }

        const check_user = await prismadb.conversation.findUnique({
            where: { id:parseInt(conversation_id) }
        })
        if (check_user?.user_id !== parseInt(user_id) && check_user?.ophthalmologist_id !== parseInt(user_id)) {
            res.status(404).json({
                success: false,
                message: "You are not authorized to view this chat."
            })
            return
        }
        
        //Update old message to read
        await prismadb.chat.updateMany({
            where: {
                    conversation_id: parseInt(conversation_id),
                    status: 'delivered',
                    sender_id: { not: parseInt(user_id) }
            },
            data: {
                status: 'read'
            }
        })

        const user = await prismadb.conversation.findMany({
            where: {
                id: parseInt(conversation_id),
                NOT: {
                    user_id: parseInt(user_id)
                }
            },
            select: {
                id:true,
            }
        })

        let profile = {}

        if (user.length === 0) {
            profile = await prismadb.conversation.findMany({
                where: { id: parseInt(conversation_id) },
                select: { 
                    User_Conversation_ophthalmologist_idToUser: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            profile_picture: true
                        }
                    }
                }
        }) 
    } else {
        profile = await prismadb.conversation.findMany({
            where: { id: parseInt(conversation_id) },
            select: { 
                User_Conversation_user_idToUser: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        profile_picture: true
                    }
                }
            }
        })
    }

        //Get old message in this chat
        const chatlog = await prismadb.chat.findMany({
            where: {
                conversation_id:parseInt(conversation_id)
            },
            select: {
                chat: true,
                timestamp: true,
                status: true,
                sender_id: true,
                conversation_id: true
            },
            orderBy: {
                timestamp: 'desc'
            }
        })

        //Response success
        res.status(200).send({
            profile,
            chatlog,
            success: true,
            message: "Chat log sent sucessfully."
        })

    } catch (error) {
        //Response Error
        console.log(error);
        res.status(400).json({
            error,
            success: false,
            message: "An unexpected error occurred while fetching the chat log."
        })
    }
}

export const chathistory = async (req:Request, res:Response) => {
    try {
        const { user_id } = req.params

        //Get user info
        const user = await prismadb.user.findFirst({
            where: {
                id:parseInt(user_id)
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_picture: true,
                is_opthamologist: true
            }
        })

        const conversations = await prismadb.conversation.findMany({
            where: user?.is_opthamologist
                ? { ophthalmologist_id: parseInt(user_id) }
                : { user_id: parseInt(user_id) },
            include: {
                User_Conversation_user_idToUser: {
                    select: { first_name: true, last_name: true, profile_picture: true }
                },
                User_Conversation_ophthalmologist_idToUser: {
                    select: { first_name: true, last_name: true, profile_picture: true }
                },
            }
        });

        const conversation_ids = conversations.map(conv => conv.id);
        const chats = await prismadb.chat.findMany({
        where: {
            conversation_id: { in: conversation_ids }
        },
        orderBy: {
            timestamp: 'desc'
        }
        });

        const chats_byconversation = chats.reduce((acc, chat) => {
            if (!acc[chat.conversation_id]) acc[chat.conversation_id] = [];
            acc[chat.conversation_id].push(chat);
            return acc;
        }, {} as Record<number, typeof chats>);

        const chatHistory = conversations.map((conv) => {
            const chatList = chats_byconversation[conv.id] || [];
            const latestChat = chatList[0];
        
            return {
                id: latestChat?.id || null,
                conversation_id: conv.id,
                chat: latestChat?.chat || '',
                timestamp: latestChat?.timestamp || null,
                status: latestChat?.status || '',
                sender_id: latestChat?.sender_id || null,
                notread: chatList.filter(c => c.status === 'delivered' && c.sender_id !== parseInt(user_id)).length,
                profile: user?.is_opthamologist
                    ? conv.User_Conversation_user_idToUser
                    : conv.User_Conversation_ophthalmologist_idToUser
            };
        });
        
        chatHistory.sort((a, b) => {
            const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return aTime - bTime;
        });

        //Response success
        res.status(200).send({
            user,
            latest_chat: chatHistory,
            success: true,
            message: "Chat history sent successfully.",
        })
    } catch (error) {
        //Response Error
        console.log(error)
        res.status(400).json({
            error,
            success: false,
            message: "An unexpected error occurred while fetching the chat history."
        })
    }
}
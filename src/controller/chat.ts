import { Response,Request } from "express";
import { prismadb } from "../lib/db";
import { io } from '../index'

export const createchat = async (req: Request, res: Response) =>  {
    try {
        const { user_id, ophthaid } = req.body
        if (!user_id || !ophthaid) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs."
            })
            return
        }
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

        const check_ophtha = await prismadb.user.findUnique({
            where: {
                id: ophthaid
            },
            select: {
                is_opthamologist: true
            }
        })
        if (check_ophtha?.is_opthamologist == false) {
            res.status(409).send({
                success: false,
                message: "Cannot create chat with user that is not opthamologist."
            })
            return
        }

        const check_chat = await prismadb.conversation.findMany({
            where: {
                user_id:user_id,
                ophthalmologist_id:ophthaid
            }
        })
        if (check_chat.length > 0) {
            res.status(409).send({
                success: false,
                message: "Chat already created."
            })
            return
        }

        const create = await prismadb.conversation.create({
            data: {
                user_id,
                ophthalmologist_id:ophthaid
            }
        })

        io.emit('newChat', { user_id, ophthaid, conversation_id: create.id });
        
        res.status(201).send({
            create,
            message: "Chat created successfully."
        })

    } catch (error) {
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
        const { conversation_id, sender_id, message} = req.body
        if (!conversation_id || !sender_id || !message) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs."
            })
            return
        }

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
                succuess: false,
                message: "You are not authorized to send in this chat."
            })
            return
        }

        const now = new Date()
        const timeZoneOffset = 7 * 60
        const timestamp = new Date(now.getTime() + timeZoneOffset * 60000)
        
        const send = await prismadb.chat.create({
            data: {
                sender_id,
                conversation_id,
                status: 'delivered',
                timestamp,
                chat: message
            }
        })

        io.to(conversation_id).emit('newMessage', {
            sender_id,
            message,
            timestamp,
        });

        res.status(201).send({
            send,
            message: "Message sent successfully."
        })

    } catch (error) {
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

        const check_chat = await prismadb.chat.findMany({
            where: {
                conversation_id:parseInt(conversation_id)
            }
        })

        if (check_chat.length <= 0) {
            res.status(404).json({
                success: false,
                message: "Chat did not exist."
            })
            return
        }
        
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

        res.status(200).send({
            chatlog,
            success: true,
            message: "Chat log sent sucessfully."
        })

    } catch (error) {
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

        type Chathistory = {
            chat: string
            conversation_id: number
            timestamp: Date
            status: string
            sender_id: number
            Conversation: {
                User_Conversation_user_idToUser?: {
                    first_name: string;
                    last_name: string;
                    profile_picture: string;
                } | null
                User_Conversation_ophthalmologist_idToUser?: {
                    first_name: string;
                    last_name: string;
                    profile_picture: string;
                } | null
            }
        }
        

        const user = await prismadb.user.findFirst({
            where: {
                id:parseInt(user_id)
            },
            select: {
                first_name: true,
                last_name: true,
                profile_picture: true,
                is_opthamologist: true
            }
        })

        let chathistory: Chathistory[] = []

        if ( user?.is_opthamologist ) {
            const conversation = await prismadb.conversation.findMany({
                where: {
                    ophthalmologist_id: parseInt(user_id)
                },
                select: {
                    id: true
                }
            }) 
            const chatid = conversation.map((conversation) => conversation.id)
            chathistory = await prismadb.chat.findMany({
                where: {
                    conversation_id: {
                        in: chatid
                    }
                },
                select: {
                    chat: true,
                    conversation_id: true,
                    timestamp: true,
                    status:true,
                    sender_id:true,
                    Conversation: {
                        select: {
                            User_Conversation_user_idToUser: {
                                select: {
                                    first_name: true,
                                    last_name: true,
                                    profile_picture: true,
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            })
        } else {
            const conversation = await prismadb.conversation.findMany({
                where: {
                    user_id: parseInt(user_id)
                },
                select: {
                    id: true
                }
            }) 
            const chatid = conversation.map((conversation) => conversation.id)
            chathistory = await prismadb.chat.findMany({
                where: {
                    conversation_id: {
                        in: chatid
                    }
                },
                select: {
                    chat: true,
                    conversation_id: true,
                    timestamp: true,
                    status:true,
                    sender_id:true,
                    Conversation: {
                        select: {
                            User_Conversation_ophthalmologist_idToUser: {
                                select: {
                                    first_name: true,
                                    last_name: true,
                                    profile_picture: true,
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            })
        }

        if (chathistory.length === 0) {
                res.status(200).send({
                    success: true,
                    message: "Not have any Chat history yet."
                })
                return
            }

        const latest_chat = Object.values(
            chathistory.reduce((acc, chat) => {
                if (!acc[chat.conversation_id] || acc[chat.conversation_id].timestamp < chat.timestamp) {
                    acc[chat.conversation_id] = chat
                }
                return acc
            }, {} as Record<number, typeof chathistory[0]>)
        )

        const chat_check = latest_chat.map((latestchat) => {
            const chat_count = chathistory.filter(
                (chat) =>
                    chat.conversation_id === latestchat.conversation_id &&
                    chat.status === "delivered" &&
                    chat.sender_id !== parseInt(user_id)
            ).length

            return {
                ...latestchat,
                notread: chat_count 
            };
        });

        chat_check.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        res.status(200).send({
            latest_chat: chat_check,
            success: true,
            message: "Chat history sent successfully.",
        })
    } catch (error) {
        console.log(error)
        res.status(400).json({
            error,
            success: false,
            message: "An unexpected error occurred while fetching the chat history."
        })
    }
}
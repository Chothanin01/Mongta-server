import { Request, Response } from "express";
import { findophth, sendchat, chatlog, chathistory } from "../src/controller/ChatController";
import { prismadb } from "../src/util/db";
import { io } from "../src/index";

// Mock Prisma database and Socket.io
jest.mock("../src/util/db", () => ({
    prismadb: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
        conversation: {
            findMany: jest.fn().mockResolvedValue([]), // Return an empty array by default
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        chat: {
            findUnique: jest.fn().mockResolvedValue(null), // Ensure `generatechatid()` can run properly
            findMany: jest.fn().mockResolvedValue([]), 
            create: jest.fn(),
            updateMany: jest.fn(),
        }
    },
}));

jest.mock("../src/index", () => ({
    io: {
        emit: jest.fn(),
        to: jest.fn(() => ({
            emit: jest.fn(),
        })),
    },
}));

describe("ChatController Tests", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis();

        mockRequest = { body: {}, params: {} };
        mockResponse = {
            status: statusMock,
            json: jsonMock,
            send: jsonMock,
        };

        jest.clearAllMocks();
    });

    // Missing required fields in `findophth`
    it("should return 400 if required fields are missing in findophth", async () => {
        mockRequest.body = {};
        await findophth(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "Missing required inputs." });
    });

    // No available ophthalmologist
    it("should return 404 if no ophthalmologist is available", async () => {
        mockRequest.body = { user_id: "1", sex: "male" };
        (prismadb.user.findUnique as jest.Mock).mockResolvedValue({ is_opthamologist: false });
        (prismadb.user.findMany as jest.Mock).mockResolvedValue([]);
        await findophth(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "No ophthamologist available." });
    });

    // Successfully create a chat
    it("should create a chat successfully", async () => {
        mockRequest.body = { user_id: "1", sex: "male" };
        (prismadb.user.findUnique as jest.Mock).mockResolvedValue({ is_opthamologist: false });
        (prismadb.user.findMany as jest.Mock).mockResolvedValue([{ id: 2, is_opthamologist: true }]);
        (prismadb.conversation.create as jest.Mock).mockResolvedValue({ id: 100 });
        await findophth(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Chat created successfully." }));
        expect(io.emit).toHaveBeenCalledWith('newChat', expect.any(Object));
    });

    // Missing required fields in `sendchat`
    it("should return 400 if required fields are missing in sendchat", async () => {
        mockRequest.body = {};
        await sendchat(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "Missing required inputs." });
    });

    // Chat does not exist in `chatlog`
    it("should return 404 if the chat does not exist", async () => {
        mockRequest.params = { conversation_id: "1", user_id: "2" };
        (prismadb.conversation.findMany as jest.Mock).mockResolvedValue([]);
        await chatlog(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "Chat did not exist." });
    });

    // No chat history found
    it("should return 200 with an empty chat history if there are no chats", async () => {
        mockRequest.params = { user_id: "1" };
        (prismadb.chat.findMany as jest.Mock).mockResolvedValue([]);
        await chathistory(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ success: true, message: "Not have any Chat history yet." });
    });

    // Fetch chat history successfully
    it("should return chat history successfully", async () => {
        mockRequest.params = { user_id: "1" };
        (prismadb.user.findFirst as jest.Mock).mockResolvedValue({ id: 1, is_opthamologist: false });
        (prismadb.conversation.findMany as jest.Mock).mockResolvedValue([{ id: 100 }]);
        (prismadb.chat.findMany as jest.Mock).mockResolvedValue([{ id: 1, chat: "Hello", conversation_id: 100, timestamp: new Date(), status: "delivered", sender_id: 2 }]);
        await chathistory(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Chat history sent successfully." }));
    });
});
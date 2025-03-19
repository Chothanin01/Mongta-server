import { Request, Response } from "express";
import { savescanlog } from "../src/controller/ScanLogController";

describe("savescanlog function", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis(); // Enable method chaining for response status

        // Mock request with necessary input data
        mockRequest = {
            body: {
                user_id: "1",
                line_right: "20/20",
                line_left: "20/30",
                va_right: "1.0",
                va_left: "0.8",
                near_description: "Normal vision",
                ai_right_image_base64: "dummyBase64Right",
                ai_left_image_base64: "dummyBase64Left",
                description: "AI analysis description",
                pic_description: "AI processed",
                pic_left_description: "Left processed",
                pic_right_description: "Right processed",
            },
        };

        // Mock response object
        mockResponse = {
            status: statusMock,
            json: jsonMock,
            send: jsonMock,
        };
    });

    it("should return 400 if required fields are missing", async () => {
        mockRequest.body = {}; // Simulate missing input fields

        await savescanlog(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            success: false,
            message: "Missing required inputs.",
        });
    });

    it("should return 400 if AI analysis is missing", async () => {
        mockRequest.body = {
            user_id: "1",
            line_right: "20/20",
            line_left: "20/30",
            va_right: "1.0",
            va_left: "0.8",
            near_description: "Normal vision",
        }; // Simulate missing AI analysis data

        await savescanlog(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            success: false,
            message: "Missing required photos or AI analysis.",
        });
    });

    it("should return 400 if AI-processed images fail to upload", async () => {
        mockRequest.body.ai_right_image_base64 = null;
        mockRequest.body.ai_left_image_base64 = null; // Simulate missing AI images

        await savescanlog(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            success: false,
            message: "Missing required photos or AI analysis.",
        });
    });

    it("should return 400 if an unexpected error occurs", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {}); // Suppress console logs
        mockRequest.body = null; // Force an unexpected error

        await savescanlog(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "An unexpected error occurred while saving the scan log.",
            })
        );
    });
});
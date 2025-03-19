import request from "supertest";
import { getfile } from "../src/controller/FirebaseController";
import { bucket } from "../src/util/bucket";
import { Request, Response } from "express";

// Mock the Firebase bucket to avoid real API calls
jest.mock("../src/util/bucket", () => ({
    bucket: {
        file: jest.fn(() => ({
            exists: jest.fn(),
            getSignedUrl: jest.fn(),
        })),
    },
}));

describe("getfile function", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis(); // Allows method chaining for response status

        mockRequest = {
            params: { fileName: "test-image.jpg" }, // Simulating a request with a file name
        };

        mockResponse = {
            status: statusMock,
            json: jsonMock,
            send: jsonMock,
        };
    });

    it("should return 404 if the file does not exist", async () => {
        (bucket.file as jest.Mock).mockReturnValue({
            exists: jest.fn().mockResolvedValue([false]), // Mock file existence check as false
            getSignedUrl: jest.fn(),
        });

        await getfile(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
            success: false,
            message: "File not found",
        });
    });

    it("should return 200 and the signed URL if the file exists", async () => {
        (bucket.file as jest.Mock).mockReturnValue({
            exists: jest.fn().mockResolvedValue([true]), // Mock file existence check as true
            getSignedUrl: jest.fn().mockResolvedValue(["https://example.com/test-image.jpg"]),
        });

        await getfile(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            image: "https://example.com/test-image.jpg",
            success: true,
            message: "Sent image url successfully",
        });
    });

    it("should return 500 if an unexpected error occurs", async () => {
        (bucket.file as jest.Mock).mockImplementation(() => {
            throw new Error("Unexpected error"); // Simulating an unexpected error
        });

        await getfile(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            success: false,
            message: "An unexpected error occurred while getting image.",
        });
    });
});
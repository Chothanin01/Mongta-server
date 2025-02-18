// npx jest tests/nearchart.test.ts

import { nearchart } from "../src/controller/NearChartController";
import { Request, Response } from "express";

describe("NearChartController", () => {

  const mockRequest = (body: any): Partial<Request> => ({ body });


  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  // Valid input test case
  it("should return correct response when valid inputs are provided", async () => {
    const req = mockRequest({ near1: 5, near2: 7, near3: 6, near4: 4 });
    const res = mockResponse();

    await nearchart(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        right_eye: expect.objectContaining({ right_line: 7 }),
        left_eye: expect.objectContaining({ left_line: 6 }),
      })
    );
  });

  // Missing input test cases
  it("should return 404 when inputs are missing", async () => {
    const req = mockRequest({ near1: 5, near2: 7, near3: 6 }); 
    const res = mockResponse();

    await nearchart(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Missing required inputs." })
    );
  });

  // Input test cases that are 0 and -1
  it("should return 404 when inputs are out of range", async () => {
    const req = mockRequest({ near1: 0, near2: 13, near3: 15, near4: -1 }); 
    const res = mockResponse();

    await nearchart(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Missing required inputs." })
    );
  });

  // Server error test case
  it("should handle server errors", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {}); 
    const req = mockRequest(null); 
    const res = mockResponse();

    await nearchart(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "An error occurred." })
    );
  });

  // Test case undefined
  it("should return 404 when one of the inputs is undefined", async () => {
    const req = mockRequest({ near1: undefined, near2: 7, near3: 6, near4: 4 }); 
    const res = mockResponse();

    await nearchart(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Missing required inputs." })
    );
  });

});
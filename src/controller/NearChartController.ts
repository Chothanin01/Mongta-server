import { Request, Response } from "express";

export const nearchart = async (req: Request,res: Response) => {
    try {
        const { near1, near2, near3, near4 } = req.body
        
        //Handle missing inputs
        if (!near1 || !near2 || !near3 || !near4) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs."
            })
            return
        }

        //Estimate line
        const right = (near1 + near2)/ 2
        const left = (near3 + near4)/ 2
        const both_eye = (right + left)/ 2

        //VA
        

        //Response success
        if (both_eye <= 3) {
            res.status(200).send({
                right,
                left,
                both_eye,
                risk: 3,
                message: "Send VA successfully"
            })
            return
        } else if (both_eye <= 6){
            res.status(200).send({
                right,
                left,
                both_eye,
                risk: 2,
                message: "Send VA successfully"
            })
            return
        } else {
            res.status(200).send({
                right,
                left,
                both_eye,
                risk: 3,
                message: "Send VA successfully"
            })
            return
        }

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

import { Request, Response } from "express";

export const nearchart = async (req: Request,res: Response) => {
    try {
        const { near1, near2, near3, near4 } = req.body
        
        //Handle missing inputs and inputs out of range 
        if (!near1 || !near2 || !near3 || !near4) {
            res.status(404).json({
                success: false,
                message: "Missing required inputs."
            })
            return
        } else if (near1 <= 0 || near1 >= 12 ||
            near2 <= 0 || near2 >= 12 ||
            near3 <= 0 || near3 >= 12 ||
            near4 <= 0 || near4 >= 12
        ) {
            res.status(404).json({
                success: false,
                message: "Invaild inputs."
            })
            return
        }

        //Right line
        let right = 0
        if (near1 > near2) {
            right = near1
        } else {
            right = near2
        }
        //Left line
        let left = 0 
        if (near3 > near4) {
            left = near3
        } else {
            left = near4
        }
        //VA
        const va = ["20/200", "20/100", "20/70", "20/50", "20/40", "20/30", "20/25", "20/20", "20/20", "20/20", "20/20"]
        const right_va = va[right-1]
        const left_va = va[left-1]

        //Risk
        const all_risk = [3, 2, 1]
        let right_risk = 0
        let left_risk = 0

        if (right%3 == 0) {
            right_risk = all_risk[(Math.floor(right/3)) - 1]
        } else {
            right_risk = all_risk[Math.floor(right/3)]
        }

        if (left%3 == 0) {
            left_risk = all_risk[(Math.floor(left/3)) - 1]
        } else {
            left_risk = all_risk[Math.floor(left/3)]
        }
        
        //Response success
        res.status(200).send({
            right_eye: {
                right_line: right,
                right_va,
                right_risk
            },
            left_eye: {
                left_line: left,
                left_va,
                left_risk
            },
            success: true,
            message: "Near chart result sent successfully."
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

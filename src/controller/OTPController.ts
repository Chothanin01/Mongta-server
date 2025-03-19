import e, { Request, Response } from "express";
import { prismadb } from "../util/db";
import { generateOTP } from "../util/OTP";
import { sendMail } from "../util/phone_mail";

export const OTP_email = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        //Handle missing inputs
        if (!email) {
            res.status(400).json({
                success: false,
                message: "Missing required inputs.",
            })
            return
        }
        const otp = await generateOTP()
        const otp_code = otp.code
        const otp_ref = otp.ref
        const create_otp = await prismadb.oTP.create({
            data: {
                Ref: otp_ref,
                OTP: otp_code,
                create_at: new Date(),
                expires_at: new Date(Date.now() + 300000),
                phone_mail: email
            }
        }
    )
        //Send OTP to email
        const mail = await sendMail(email, "OTP Verification", `<h1>Your OTP for verification is ${otp_code}<br>Ref: ${otp_ref}</h1>`)

        //Response Success
        res.status(200).send({
            Ref: otp_ref,
            success: true,
            message: "OTP sent successfully."
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

export const OTP_phone = async (req: Request, res: Response) => {
    try {

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
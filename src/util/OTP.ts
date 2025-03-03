import exp from "constants";
import crypto from "crypto";
import { prismadb } from "./db";

export async function generateOTP() {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const ref = crypto.randomBytes(6).toString("hex").slice(0, 6) 
    return {code, ref}
}

export async function verifyOTP(ref: string, code: string, phone_mail: string) {
    const otp = await prismadb.oTP.findFirst({
        where: {
            Ref: ref,
            OTP: code,
        }
})
    if (!otp) {
        return "OTP not found." 
    }
    if (otp.Ref === ref && otp.OTP === code && otp.phone_mail != phone_mail && otp.expires_at > new Date()) {
        return "OTP verified."
    } else {
        return "OTP invalid."
    }
}
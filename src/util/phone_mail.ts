import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import twilio from 'twilio';
dotenv.config()
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  })

export const sendMail = async (to: string, subject: string, html: string) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL,
            to,
            subject,
            html,
        })
    } catch (error) {
        throw error
        console.log(error)
    }
}

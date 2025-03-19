import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

export const sendMail = async (to: string, subject: string, html: string) => {
    try {
        // Create a proper transporter with complete configuration
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD, // Use app password for Gmail
            },
            tls: {
                rejectUnauthorized: false // For development
            },
            debug: true, // show debug output
            logger: true // log information in console
        });

        await transporter.sendMail({
            from: `"MongTa" <${process.env.EMAIL}>`,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.log("Email sending error:", error);
        throw error;
    }
}

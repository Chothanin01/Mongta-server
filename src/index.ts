import express, { Request, Response } from "express";
import cors from "cors";
import { Server } from "socket.io";
import { chathistory, chatlog, findophth, sendchat } from "./controller/ChatController";
import { getNearbyHospitals } from './controller/HospitalController';
import { ophtha_scanlog, savescanlog, scanlog } from "./controller/ScanLogController";
import { searchHospitals } from './controller/HospitalSearch';
import { multipleupload, uploadmiddleware } from "./controller/FirebaseController";
import { googleregister, register } from "./controller/RegisterController";
import { googlelogin, login } from "./controller/LoginController";
import { middleware } from "./controller/MiddlewareController";
import { OTP_email, OTP_phone } from "./controller/OTPController";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
// Dynamic CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://mongta-66831.firebaseapp.com'] 
  : ['http://localhost:3000', 'http://10.0.2.2:3000','http://localhost:56899', 'http://10.0.2.2:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const appServer = app.listen(PORT , () => {
  console.log(`Server is running on port ${PORT}`);
})

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/nearby-hospitals", getNearbyHospitals)
app.get("/api/scanlog/:user_id" , scanlog)
app.post("/api/savescanlog", multipleupload, savescanlog)
app.get("/api/scanlog/ophtha/:conversation_id", ophtha_scanlog)
app.post("/api/createchat", middleware, findophth)
app.post("/api/sendchat", uploadmiddleware, middleware, sendchat)
app.get("/api/chat/:conversation_id/:user_id", middleware, chatlog)
app.get("/api/chathistory/:user_id", middleware, chathistory)
app.post("/api/register", register)
app.post("/api/login", login)
app.post("/api/googlelogin", googlelogin)
app.post("/api/googleregister", googleregister)
app.post("/api/otp/mail", OTP_email)
app.post("/api/otp/phone", OTP_phone)
app.get('/nearby-hospitals', getNearbyHospitals);
app.get('/search-hospitals', searchHospitals);

//Declare socket.io
export const io = new Server({
  cors: {
      origin: "http://localhost:3000"
  }
})

//Connect socket.io
io.on('connection', (socket) => {

  socket.on('join', (conversation_id: string, user_id: string) => {
      socket.join(conversation_id);
      console.log(`${user_id} joined room: ${conversation_id}`);
      
      socket.to(conversation_id).emit('User joined', { user_id });

      socket.on('sendMessage', (messageData: { sender_id: string, message: string }) => {
          socket.to(conversation_id).emit('newMessage', messageData);
      });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})

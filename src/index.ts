import express, { Request, Response } from "express";
import cors from "cors";
import { prismadb } from "./util/db";
import { Server } from "socket.io";
import { googleregister, register } from "./controller/RegisterController";
import { googlelogin, login } from "./controller/LoginController";
import { middleware, signout } from "./controller/MiddlewareController";
import { multipleupload, uploadmiddleware } from "./controller/FirebaseController";
import { chathistory, chatlog, findophth, sendchat } from "./controller/ChatController";
import { nearchart } from "./controller/NearChartController";
import { getNearbyHospitals } from './controller/HospitalController';
import { searchHospitals } from './controller/HospitalSearch';
import { ophtha_scanlog, savescanlog, scanlog } from "./controller/ScanLogController";
import { changePassword, forgetPassword, getuser, updateuser, usernotification, ophthnotification } from "./controller/ProflieController";
import { OTP_email, OTP } from "./controller/OTPController";
import { offline, online } from "./controller/StatusController";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
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

//API routes

//Authentication routes
app.post("/api/register", register)
app.post("/api/login", login)
app.post("/api/googlelogin", googlelogin)
app.post("/api/googleregister", googleregister)
app.post("/api/signout", middleware, signout)

//Chat routes
app.post("/api/findophth", middleware, findophth)
app.post("/api/sendchat", uploadmiddleware, middleware, sendchat)
app.get("/api/chat/:conversation_id/:user_id", middleware, chatlog)
app.get("/api/chathistory/:user_id", middleware, chathistory)

//Hospital routes
app.get('/nearby-hospitals', middleware, getNearbyHospitals);
app.get('/search-hospitals', middleware, searchHospitals);

//Scanlog routes
app.get("/api/scanlog/:user_id", middleware, scanlog)
app.post("/api/savescanlog", multipleupload, middleware, savescanlog)
app.get("/api/scanlog/ophtha/:conversation_id", middleware, ophtha_scanlog)

//OTP routes
app.post("/api/otp/mail", OTP_email)
app.post("/api/otp", OTP)

//NearChart routes
app.post("/api/nearchart", middleware, nearchart)

//Profile routes
app.get("/api/getuser", middleware, getuser)
app.post("/api/changepassword", middleware, changePassword)
app.post("/api/forgetpassword", forgetPassword)
app.post("/api/updateuser", uploadmiddleware, middleware, updateuser)
app.get("/api/usernoti", middleware, usernotification)
app.get("/api/ophtnoti", middleware, ophthnotification)

//Status routes
app.post("/api/online", middleware, online)
app.post("/api/offline", middleware, offline)

//Declare socket.io
export const io = new Server(appServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

//Connect socket.io
io.on('connection', (socket) => {
  // Get user ID from headers rather than query to be more reliable
  const userId = socket.handshake.headers.userid || 
                socket.handshake.query.userId;
                
  console.log(`User ${userId} connected via socket`);
  
  // Handle status changes
  socket.on('status_change', async (data) => {
    try {
      console.log(`User ${userId} status changed to ${data.status}`);
      
      if (userId && data.status) {
        await prismadb.user.update({
          where: { id: Number(userId) },
          data: { status: data.status }
        });
        
        // Broadcast to all other connected clients
        socket.broadcast.emit('user_status_changed', {
          userId: userId,
          status: data.status
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });
  
  socket.on('disconnect', async () => {
    console.log(`User ${userId} disconnected`);
    
    try {
      await prismadb.user.update({
        where: { id: Number(userId) },
        data: { status: 'offline' }
      });
    } catch (error) {
      console.error('Error updating user status on disconnect:', error);
    }
  });
  
  socket.on('join', (data) => {
    const { conversationId, userId } = data;
    socket.join(conversationId);
    console.log(`${userId} joined room: ${conversationId}`);
    socket.to(conversationId).emit('User joined', { user_id: userId });

    socket.on('sendMessage', (messageData: { sender_id: string, message: string }) => {
        socket.to(conversationId).emit('newMessage', messageData);
    });
  });
});

import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { chathistory, chatlog, createchat, sendchat } from "./controller/ChatController";
import cors from 'cors';
import { getNearbyHospitals } from './controller/HospitalController';
import { ophtha_scanlog, savescanlog, scanlog } from "./controller/ScanLogController";

import { getfile, multipleupload, uploadmiddleware, uploadtest } from "./controller/FirebaseController";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/api/createchat", createchat)
app.post("/api/sendchat", uploadmiddleware, sendchat)
app.get("/api/chat/:conversation_id/:user_id", chatlog)
app.get("/api/chathistory/:user_id", chathistory)
app.get("/nearby-hospitals", getNearbyHospitals)
app.get("/api/scanlog/:user_id" , scanlog)
app.post("/api/savescanlog", multipleupload, savescanlog)
app.get("/api/scanlog/ophtha/:conversation_id", ophtha_scanlog)
app.post("/api/upload", uploadmiddleware, uploadtest)
app.get("/api/geturl" , getfile)

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

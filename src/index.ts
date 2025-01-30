import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { chathistory, chatlog, createchat, sendchat } from "./controller/ChatController";
import { getfile, uploadmiddleware, uploadtest } from "./controller/FirebaseController";

const app = express();
const PORT = process.env.PORT || 5000;

const appServer = app.listen(PORT , () => {
  console.log(`Server is running on port ${PORT}`);
})

app.use(express.json());

app.post("/api/createchat", createchat)
app.post("/api/sendchat", uploadmiddleware, sendchat)
app.get("/api/chat/:conversation_id/:user_id", chatlog)
app.get("/api/chathistory/:user_id", chathistory)
app.post("/api/upload", uploadmiddleware, uploadtest)
app.get("/api/geturl" , getfile)

//Declare socket.io
export const io = new Server(appServer, {
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


app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Node.ts");
});

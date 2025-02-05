import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { chathistory, chatlog, createchat, sendchat } from "./controller/ChatController";
import { getfile, uploadmiddleware, uploadtest } from "./controller/FirebaseController";
import { facebookregister, googleregister, register } from "./controller/RegisterController";
import { facebooklogin, googlelogin, login } from "./controller/LoginController";
import { middleware } from "./controller/MiddlewareController";

const app = express();
const PORT = process.env.PORT || 5000;

const appServer = app.listen(PORT , () => {
  console.log(`Server is running on port ${PORT}`);
})

app.use(express.json());

app.post("/api/createchat", middleware, createchat)
app.post("/api/sendchat", uploadmiddleware, middleware, sendchat)
app.get("/api/chat/:conversation_id/:user_id", middleware, chatlog)
app.get("/api/chathistory/:user_id", middleware, chathistory)
app.post("/api/upload", uploadmiddleware, middleware, uploadtest)
app.get("/api/geturl" , middleware, getfile)
app.post("/api/register", register)
app.post("/api/login", login)
app.post("/api/googlelogin", googlelogin)
app.post("/api/facebooklogin", facebooklogin)
app.post("/api/googleregister", googleregister)
app.post("/api/facebookregister", facebookregister)

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

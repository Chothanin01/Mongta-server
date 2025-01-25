import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 5000;

const appServer = app.listen(PORT , () => {
  console.log(`Server is running on port ${PORT}`);
})

app.get("/", (req: Request, res: Response) => {
    res.send("Welco to the Node.js dsa");
  });
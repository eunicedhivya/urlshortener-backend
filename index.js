import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import client from "./db.js";
import { usersRouter } from "./routes/users.js";

dotenv.config();
// console.log(process.env.MONGO_URL);

const app = express();

app.use(cors());
app.use(express.json());

// Port for localhost
const PORT = process.env.PORT;

const DB_NAME = "bitlyclone";

app.get("/", (request, response) => {
  response.send({
    msg: "URL shortener",
  });
});

app.use("/users", usersRouter);

app.listen(PORT, () => console.log("Server is started in " + PORT));

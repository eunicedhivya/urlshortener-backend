import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import client from "./db.js";
import session from "express-session";
import { usersRouter } from "./routes/users.js";
import { passwordResetRouter } from "./routes/passwordreset.js";

dotenv.config();
// console.log(process.env.MONGO_URL);

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND,
    credentials: true,
  })
);

app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      sameSite: "none", // must be 'none' to enable cross-site delivery
      secure: true, // must be true if sameSite='none'
    },
  })
);

// Port for localhost
const PORT = process.env.PORT;

const DB_NAME = "bitlyclone";

app.get("/", (request, response) => {
  response.send({
    msg: "URL shortener",
  });
});

app.use("/users", usersRouter);
app.use("/password-reset", passwordResetRouter);

app.listen(PORT, () => console.log("Server is started in " + PORT));

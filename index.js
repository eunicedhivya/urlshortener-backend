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
import { profileRouter } from "./routes/profile.js";

dotenv.config();
// console.log(process.env.MONGO_URL);

const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND,
      "https://urlshortener-clone.herokuapp.com",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

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

// ON clicking ShortURL redirect to appropriate URL
app.get("/:shorturl", async function (request, response) {
  try {
    // Get the LongURL based on shortURL code
    const myInfo = await client
      .db(DB_NAME)
      .collection("shortlinks")
      .findOne({ shortUrl: request.params.shorturl });

    const myInfo2 = await client
      .db(DB_NAME)
      .collection("shortlinks")
      .updateOne(
        { shortUrl: request.params.shorturl },
        { $inc: { clicks: 1 } }
      );

    // Redirect to the Correct URL
    response.redirect(myInfo.longUrl);
  } catch (err) {
    response.status(500).json({ errorMessage: "Internal Server Error" });
  }
});

app.use("/users", usersRouter);
app.use("/password-reset", passwordResetRouter);
app.use("/profile", passwordResetRouter);

app.listen(PORT, () => console.log("Server is started in " + PORT));

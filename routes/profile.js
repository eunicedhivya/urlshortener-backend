import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import client from "../db.js";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import dotenv from "dotenv";
dotenv.config();

import {
  genPassword,
  createUser,
  checkUserExists,
  getUserByToken,
  activateAccount,
  getUserByEmail,
} from "../helper/users.js";

// import { createUser, getUserByName } from "../helper.js";

const router = express.Router();

const DB_NAME = "bitlyclone";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.MY_EMAIL_ID,
    pass: process.env.MY_EMAIL_PASS,
  },
});

router.post("/signup", async function (request, response) {
  // Get the info from body
  const { fname, lname, email, password } = request.body;

  //Check if User Exist and send error message if True
  const userExists = await checkUserExists(email, DB_NAME, "users");
  if (userExists) {
    return response.status(400).send({ message: "Account already exists" });
  }

  // Generate Encrypted Password
  const hashedPassword = await genPassword(password);
  const genRandomCode = cryptoRandomString({ length: 50, type: "url-safe" });

  //Form User Object for adding to DB
  const newUser = {
    fname: fname,
    lname: lname,
    email: email,
    password: hashedPassword,
    statusToken: genRandomCode,
    status: "pending",
  };

  //   db.users.insertOne(newUser)
  const result = await createUser(newUser, DB_NAME, "users");
  //   console.log("result", result);

  const genVerifyURL =
    "http://" +
    request.headers.host +
    "/users/verify-email?token=" +
    newUser.statusToken;

  const mailerOptions = {
    from: "URL Shortener App <dhivya.eunice@gmail.com>",
    to: newUser.email,
    subject: "URL Shortener App: Verify your email id",
    html:
      "Thank you for registering with us. Please click on the following link to confirm you email and activate your account. <br> <a href='" +
      genVerifyURL +
      "'target='_blank'>" +
      genVerifyURL +
      "</a>",
  };

  //   console.log(mailerOptions);

  transporter.sendMail(mailerOptions, function (error, info) {
    if (error) {
      //   console.log(error);
      return response.status(400).send({ message: "Account already exists" });
    } else {
      console.log("verification email sent to ur registered email");
    }
  });

  response.status(200).json({
    message:
      "signup successful. verification email sent to ur registered email",
    user: newUser,
  });
});

export const profileRouter = router;

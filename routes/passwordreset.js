import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import client from "../db.js";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
dotenv.config();

import {
  genPassword,
  createUser,
  checkUserExists,
  getUserByToken,
  activateAccount,
  getUserByEmail,
  addToken,
  getUserById,
  changePassword,
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

// Use EndPoint to Send Reset EMail
router.post("/", async function (request, response) {
  const { email } = request.body;
  const result = await getUserByEmail(email, DB_NAME, "users");
  console.log(result._id);
  const genRandomCode = cryptoRandomString({ length: 50, type: "url-safe" });

  const genURL =
    "http://" +
    request.headers.host +
    "/password-reset/" +
    result._id +
    "/" +
    genRandomCode;

  // store token in Document Temporarily
  const submitToken = await addToken(email, genRandomCode, DB_NAME, "users");

  // Send Mailer with Generated URL
  const mailerOptions = {
    from: "URL Shortener App <dhivya.eunice@gmail.com>",
    to: result.email,
    subject: "URL Shortener App: Verify your email id",
    html:
      "Thank you for registering with us. Please click on the following link to confirm you email and activate your account. <br> <a href='" +
      genURL +
      "'target='_blank'>" +
      genURL +
      "</a>",
  };

  transporter.sendMail(mailerOptions, function (error, info) {
    if (error) {
      return response
        .status(400)
        .send({ message: "Password reset sent not sent" });
    } else {
      return response.status(200).json({
        message: "Password reset email sent to ur registered email",
      });
    }
  });
});

// Use EndPoint to reset password by using Userid (_id) and token
// router.get("/:userid/:token", async function (request, response) {
//   const { userid, token } = request.params;
//   //   console.log(userid);
//   //   console.log(token);
//   const result = await getUserById(userid, DB_NAME, "users");
//   console.log(result);
//   if (!result)
//     return response.status(400).send({ message: "The link is invalid" });

//   const usertoken = result.token;
//   if (!usertoken)
//     return response.status(400).send({ message: "The link is invalid" });

//   response.status(200).send("The link is valid");
// });

router.post("/:userid/:token", async function (request, response) {
  const { password } = request.body;
  const { userid, token } = request.params;
  console.log(userid);
  console.log(token);
  console.log(password);
  const chosenUser = await getUserById(userid, DB_NAME, "users");
  console.log(chosenUser.token === token);
  if (chosenUser.token !== token)
    return response.status(400).json({ message: "The Link is invalid" });

  const hashedPassword = await genPassword(password);

  const editPassword = await changePassword(
    hashedPassword,
    userid,
    DB_NAME,
    "users"
  );

  response.status(200).json({ message: "The Password has been updated" });
});

export const passwordResetRouter = router;

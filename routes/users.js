import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import client from "../db.js";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import dotenv from "dotenv";
import auth from "../middleware/auth.js";
import { ObjectId } from "mongodb";
dotenv.config();

import {
  genPassword,
  createUser,
  checkUserExists,
  getUserByToken,
  activateAccount,
  getUserByEmail,
  // getMyInfo,
} from "../helper/users.js";

// import { createUser, getUserByName } from "../helper.js";

const router = express.Router();

const DB_NAME = "bitlyclone";

function formatted_date() {
  var result = "";
  var d = new Date();
  result += d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
  return result;
}

// console.log(formatted_date());

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
    return response
      .status(400)
      .send({ message: "Account already exists", msgType: "error" });
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
      return response
        .status(400)
        .json({ message: "Account already exists", msgType: "error" });
    } else {
      return response.status(400).json({
        message: "Verification mail sent to registered email",
        msgType: "success",
      });
    }
  });

  // response.status(200).json({
  //   message:
  //     "signup successful. verification email sent to ur registered email",
  //   user: newUser,
  // });
});

router.get("/verify-email", async function (request, response) {
  const token = request.query.token;
  console.log(token);

  const userExists = await getUserByToken(token, DB_NAME, "users");
  if (userExists) {
    await activateAccount(token, DB_NAME, "users");
    // response.status(200).json({
    //   message: "account activated",
    // });
    response.status(200).redirect(`${process.env.FRONTEND}/account-activated`);
  } else {
    response.status(400).json({
      message: "account doesn't exist",
    });
  }
});

router.post("/login", async function (request, response) {
  try {
    const { email, password } = request.body;

    // Check if email/password is entered
    if (!email || !password)
      return response.status(400).json({
        message: "Please enter all required fields.",
        msgType: "error",
      });

    // check if user is present in DB
    const userFromDB = await getUserByEmail(email, DB_NAME, "users");

    // const hashedPassword = await genPassword(password);

    if (!userFromDB) {
      response
        .status(401)
        .json({ message: "Invalid Credentials", msgType: "error" });
    } else {
      const storedPassword = userFromDB.password;
      const isPasswordMatch = await bcrypt.compare(password, storedPassword);

      if (userFromDB.status === "pending") {
        response
          .status(401)
          .json({ message: "Account not activated yet", msgType: "error" });
      }

      if (!isPasswordMatch) {
        response
          .status(401)
          .json({ message: "Invalid Credentials", msgType: "error" });
      } else {
        const token = jwt.sign({ id: userFromDB._id }, process.env.SECRET_KEY);
        // response.cookie("token", token, {
        //   expiresIn: "1d",
        //   httpOnly: true,
        //   secure: true,
        //   sameSite: "none",
        // });
        // response.setHeader("x-auth-token", token);
        response.json({
          message: "Login Successful",
          id: userFromDB._id,
          msgType: "success",
          token: token,
        });
      }
    }
  } catch (err) {
    console.log(err);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/logout", (request, response) => {
  try {
    response.clearCookie("token").status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/me", auth, async function (request, response) {
  try {
    // const token = request.cookies.token;
    const token = request.body.token;
    if (!token) {
      return response.json(false);
    }

    // console.log(request.body);

    const decoded = jwt.decode(token, process.env.SECRET_KEY);
    // const myInfo = await getMyInfo(decoded.id, DB_NAME, "users");
    console.log(decoded);

    const myInfo = await client
      .db(DB_NAME)
      .collection("users")
      .findOne({ _id: ObjectId(decoded.id) });

    // console.log(myInfo);
    response.status(200).json(myInfo);

    // jwt.verify(token, process.env.SECRET_KEY);

    // response.send(true);
  } catch (err) {
    response.json(false);
  }
});
// router.get("/me", auth, async function (request, response) {
//   try {
//     const token = request.cookies.token;
//     // if (!token) {
//     //   return response.json(false);
//     // }

//     const decoded = jwt.decode(token, process.env.SECRET_KEY);
//     // const myInfo = await getMyInfo(decoded.id, DB_NAME, "users");
//     // console.log(token);

//     const myInfo = await client
//       .db(DB_NAME)
//       .collection("users")
//       .findOne({ _id: ObjectId(decoded.id) });

//     response.json(myInfo);
//     // console.log(token);

//     // jwt.verify(token, process.env.SECRET_KEY);

//     // response.send(true);
//   } catch (err) {
//     response.json(false);
//   }
// });

router.post("/create", auth, async function (request, response) {
  try {
    const { longUrl, token } = request.body;
    // const token = request.cookies.token;
    console.log("create", longUrl, token);

    const decoded = jwt.decode(token, process.env.SECRET_KEY);

    // console.log("token", token);
    // console.log("longUrl", decoded);
    const genRandomCode = cryptoRandomString({ length: 10, type: "url-safe" });

    const shortUrl = genRandomCode;

    // //Form User Object for adding to DB
    const newShortLink = {
      userid: decoded.id,
      longUrl: longUrl,
      shortUrl: shortUrl,
      timestamp: formatted_date(),
      clicks: 0,
    };

    // console.log(newShortLink);

    const myInfo = await client
      .db(DB_NAME)
      .collection("shortlinks")
      .insertOne(newShortLink);

    response.status(200).json({
      message: "shortlink created",
      msgType: "success",
      shortUrl: "http://" + request.headers.host + "/" + shortUrl,
    });
  } catch (err) {
    response
      .status(500)
      .json({ message: "Internal Server Error", msgType: "fail" });
  }

  //   db.users.insertOne(newUser)
  // const result = await createUser(newUser, DB_NAME, "users");
  //   console.log("result", result);

  // const genVerifyURL =
  //   "http://" +
  //   request.headers.host +
  //   "/users/verify-email?token=" +
  //   newUser.statusToken;

  // const mailerOptions = {
  //   from: "URL Shortener App <dhivya.eunice@gmail.com>",
  //   to: newUser.email,
  //   subject: "URL Shortener App: Verify your email id",
  //   html:
  //     "Thank you for registering with us. Please click on the following link to confirm you email and activate your account. <br> <a href='" +
  //     genVerifyURL +
  //     "'target='_blank'>" +
  //     genVerifyURL +
  //     "</a>",
  // };

  // //   console.log(mailerOptions);

  // transporter.sendMail(mailerOptions, function (error, info) {
  //   if (error) {
  //     //   console.log(error);
  //     return response.status(400).send({ message: "Account already exists" });
  //   } else {
  //     console.log("verification email sent to ur registered email");
  //   }
  // });

  // response.status(200).json({
  //   message:
  //     "signup successful. verification email sent to ur registered email",
  //   user: newUser,
  // });
});

router.post("/datapoints", auth, async function (request, response) {
  try {
    const token = request.body.token;
    const decoded = jwt.decode(token, process.env.SECRET_KEY);

    console.log("datapoints", decoded);

    const db1 = client.db(DB_NAME);
    const coll = db1.collection("shortlinks");

    const pipeline = [
      { $match: { userid: decoded.id } },
      { $group: { _id: "$timestamp", count: { $sum: 1 } } },
    ];
    const aggCursor = coll.aggregate(pipeline);

    const list = [];
    for await (const doc of aggCursor) {
      list.push(doc);
    }

    console.log(list);

    response.status(200).json(list);
  } catch (err) {
    response.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/links", auth, async function (request, response) {
  try {
    const token = request.body.token;
    const decoded = jwt.decode(token, process.env.SECRET_KEY);
    const myInfo = await client
      .db(DB_NAME)
      .collection("shortlinks")
      .find({ userid: decoded.id })
      .toArray();
    // console.log("myInfo", myInfo);
    response.status(200).json(myInfo);
  } catch (err) {
    response.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/loggedIn", (request, response) => {
  try {
    const token = request.body.token;
    if (!token) {
      return response.json(false);
    }

    jwt.verify(token, process.env.SECRET_KEY);

    response.send(true);
  } catch (err) {
    response.json(false);
  }
});
// router.get("/loggedIn", (request, response) => {
//   try {
//     const token = request.cookies.token;
//     if (!token) {
//       return response.json(false);
//     }

//     // console.log(token);

//     jwt.verify(token, process.env.SECRET_KEY);

//     response.send(true);
//   } catch (err) {
//     response.json(false);
//   }
// });

export const usersRouter = router;

import bcrypt from "bcrypt";
import client from "../db.js";
import { ObjectId } from "mongodb";

async function genPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(salt, hashedPassword);
  return hashedPassword;
}

async function createUser(newUser, dbName, colName) {
  return await client.db(dbName).collection(colName).insertOne(newUser);
}
async function checkUserExists(useremail, dbName, colName) {
  return await client
    .db(dbName)
    .collection(colName)
    .findOne({ email: useremail });
}
async function getUserByToken(token, dbName, colName) {
  return await client
    .db(dbName)
    .collection(colName)
    .findOne({ statusToken: token });
}
async function getUserById(userid, dbName, colName) {
  return await client
    .db(dbName)
    .collection(colName)
    .findOne({ _id: ObjectId(userid) });
}
async function getMyInfo(userid, dbName, colName) {
  return await client
    .db(dbName)
    .collection(colName)
    .findOne({ _id: ObjectId(userid) });
}
async function getUserByEmail(email, dbName, colName) {
  return await client.db(dbName).collection(colName).findOne({ email: email });
}
async function addToken(email, genRandomCode, dbName, colName) {
  return await client
    .db(dbName)
    .collection(colName)
    .updateOne({ email: email }, { $set: { token: genRandomCode } });
}
async function activateAccount(token, dbName, colName) {
  //   await client
  //     .db(dbName)
  //     .collection(colName)
  //     .findOne({ statusToken: token });
  await client
    .db(dbName)
    .collection(colName)
    .updateOne(
      { statusToken: token },
      {
        $set: { statusToken: null, status: "active" },
      }
    );
}
async function changePassword(hashedPassword, userid, dbName, colName) {
  await client
    .db(dbName)
    .collection(colName)
    .updateOne(
      { _id: ObjectId(userid) },
      {
        $set: { password: hashedPassword },
        $unset: { token: "" },
      }
    );
}

export {
  genPassword,
  createUser,
  checkUserExists,
  getUserByToken,
  activateAccount,
  getUserByEmail,
  addToken,
  getUserById,
  changePassword,
  getMyInfo,
};

import bcrypt from "bcrypt";
import client from "../db.js";

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

export {
  genPassword,
  createUser,
  checkUserExists,
  getUserByToken,
  activateAccount,
};

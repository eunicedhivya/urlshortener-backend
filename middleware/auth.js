import jwt from "jsonwebtoken";

function auth(request, response, next) {
  try {
    // console.log("auth", request.body);
    const token = request.body.token;
    if (!token)
      return response.status(401).json({ errorMessage: "Unauthorized" });

    // console.log("#token", token);

    const verified = jwt.verify(token, process.env.SECRET_KEY);
    request.user = verified.user;
    console.log("verified user");
    next();
  } catch (err) {
    console.log(err);
    response.status(500).json({
      errorMsg: "Internal Server Error",
    });
  }
}

export default auth;

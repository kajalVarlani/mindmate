import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  //console.log("AUTH HEADER 👉", req.headers.authorization);

  if (!req.headers.authorization) {
    return res.status(401).json({ message: "No auth header" });
  }

  const token = req.headers.authorization.split(" ")[1];
  //console.log("TOKEN 👉", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log("DECODED 👉", decoded);

    req.user = decoded;
    next();
  } catch (err) {
    //console.log("JWT ERROR 👉", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

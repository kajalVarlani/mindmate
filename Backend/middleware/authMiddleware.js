import jwt from "jsonwebtoken";

const protect = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid auth header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // or { id: decoded.id }

    next();

  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default protect;

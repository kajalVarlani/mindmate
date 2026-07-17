import jwt from "jsonwebtoken";

const protect = (role) => (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid auth header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Default to "user" if no role is explicitly present (for backward compatibility)
    const userRole = decoded.role || "user";
    if (role && userRole !== role) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    req.user = {
      id: decoded.userId,
      role: userRole,
      name: decoded.name
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const protectUser = protect("user");
export const protectTherapist = protect("therapist");
export const protectAdmin = protect("admin");

export default protectUser;

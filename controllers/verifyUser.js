import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  if (req.user) return next();

  const tokenString = req.header("Authorization");
  if (!tokenString) {
    return res.status(401).json({ message: "You are not authenticated!" });
  }
  const token = tokenString.replace("Bearer ", "");

  jwt.verify(token, process.env.JWT_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Token is not valid!" });
    req.user = user;
    next();
  });
};

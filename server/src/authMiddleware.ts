import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

interface DecodedToken {
  id: string;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("No token provided");
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    req.body.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Error during JWT verification:");
    console.error("Token causing error:", token);
    console.error("Error message:", (err as Error).message);

    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

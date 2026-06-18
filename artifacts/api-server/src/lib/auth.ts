import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

// Extend Request to carry userId after auth check
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware: require a valid Clerk session on protected routes
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const userId = (auth?.sessionClaims?.userId as string) || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

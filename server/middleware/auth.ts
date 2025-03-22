import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    passport?: {
      user?: number;
    };
  }
}

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.user!.id);
    if (!user || !user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden - Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

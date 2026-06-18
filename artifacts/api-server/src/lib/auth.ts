import type { Request, Response, NextFunction } from "express";
import { getSupabaseClient } from "./supabase";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    res.status(503).json({ error: "Auth not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" });
    return;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = user.id;
  next();
};

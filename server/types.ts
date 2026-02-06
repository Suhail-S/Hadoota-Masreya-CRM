import type { User } from "../shared/schema";
import type { Request } from "express";

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

// Type for authenticated requests
export interface AuthRequest extends Request {
  user: {
    id: string;
    username: string;
    role: string;
  };
}

// Helper to ensure string parameter (not array)
export function ensureString(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

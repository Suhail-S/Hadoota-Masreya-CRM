import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import path from "path";

const app = express();

// Trust proxy for accurate IP address extraction behind Vercel
app.set("trust proxy", true);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize the app for serverless
let isInitialized = false;

async function initializeApp() {
  if (!isInitialized) {
    console.log('[VERCEL] Initializing CRM app...');

    // Register API routes
    registerRoutes(app);
    console.log('[VERCEL] Routes registered');

    // Serve static files from public directory
    // In Vercel, the static files are in /var/task/dist/public
    const clientDistPath = path.join(process.cwd(), "dist", "public");
    app.use(express.static(clientDistPath));

    // All remaining routes serve the React app
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });

    // Error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ error: message });
    });

    isInitialized = true;
    console.log('[VERCEL] App initialized successfully');
  }
}

// Export for Vercel serverless
export default async (req: any, res: any) => {
  try {
    await initializeApp();
    return app(req, res);
  } catch (error) {
    console.error('[VERCEL] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
};

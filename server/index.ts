import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Register API routes first
registerRoutes(app);

// Serve static files from client/dist in production
const clientDistPath = path.join(__dirname, "../client/dist");
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

// Export app for Vercel serverless
export default app;

// Start server only in development (not serverless)
if (process.env.NODE_ENV !== 'production' || process.argv[1]?.includes('tsx')) {
  const PORT = process.env.PORT || 3100;
  app.listen(PORT, () => {
    console.log(`[CRM] Server running on http://localhost:${PORT}`);
    console.log(`[CRM] API available at http://localhost:${PORT}/api`);
  });
}

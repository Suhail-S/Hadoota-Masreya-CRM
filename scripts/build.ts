import { build as esbuild } from "esbuild";
import { rm, readFile, mkdir, cp } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Server deps to bundle
const allowlist = [
  "axios",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "cookie-parser",
  "jsonwebtoken",
  "bcryptjs",
  "multer",
  "pg",
  "zod",
  "@supabase/supabase-js",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("Building client...");
  await execAsync("cd client && npm install && npm run build");
  console.log("✅ Client built");

  console.log("Copying client files to dist/public...");
  await mkdir("dist/public", { recursive: true });
  await cp("client/dist", "dist/public", { recursive: true });
  console.log("✅ Client files copied");

  console.log("Building Vercel serverless entry point...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/vercel.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/vercel.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("✅ Build complete!");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});

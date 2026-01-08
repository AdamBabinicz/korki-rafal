import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// --- KONFIGURACJA BEZPIECZEŃSTWA I PRZEKIEROWAŃ (Render/SEO) ---
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const host = req.headers.host || "";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;

  // 1. HSTS (Nowość: Naprawa błędu z audytu)
  // Wymusza HTTPS przez 1 rok (31536000 sekund) i obejmuje subdomeny
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // 2. Przekierowanie www -> bez-www (Canonical SEO)
  if (host.startsWith("www.")) {
    const newHost = host.replace("www.", "");
    return res.redirect(301, `https://${newHost}${req.originalUrl}`);
  }

  // 3. Wymuszenie HTTPS na produkcji
  if (process.env.NODE_ENV === "production" && protocol !== "https") {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  next();
});
// ---------------------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  } else {
    serveStatic(app);

    app.get("*", (_req, res) => {
      const pathA = path.join(process.cwd(), "dist", "public", "index.html");
      const pathB = path.join(process.cwd(), "dist", "index.html");

      if (fs.existsSync(pathA)) {
        res.sendFile(pathA);
      } else if (fs.existsSync(pathB)) {
        res.sendFile(pathB);
      } else {
        console.error("Błąd SPA: Nie znaleziono index.html");
        res.status(500).send(`
          <h1>Błąd konfiguracji serwera</h1>
          <p>Nie udało się znaleźć pliku <code>index.html</code>.</p>
        `);
      }
    });
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();

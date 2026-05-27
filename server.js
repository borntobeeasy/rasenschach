import { createHmac, randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const root = fileURLToPath(new URL(".", import.meta.url));
const dataDir = join(root, "data");
const dbFile = join(dataDir, "users.json");
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const sections = new Set(["theses", "board", "results", "randomizer", "images"]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function createEmptyDb() {
  return {
    secret: randomBytes(32).toString("hex"),
    users: [],
  };
}

function loadDb() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dbFile)) {
    const db = createEmptyDb();
    saveDb(db);
    return db;
  }

  const db = JSON.parse(readFileSync(dbFile, "utf8"));
  if (!db.secret) db.secret = randomBytes(32).toString("hex");
  if (!Array.isArray(db.users)) db.users = [];
  return db;
}

function saveDb(db) {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf8");
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function passwordMatches(password, user) {
  const candidate = Buffer.from(hashPassword(password, user.salt).hash, "hex");
  const stored = Buffer.from(user.passwordHash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

function signToken(userId) {
  const body = Buffer.from(JSON.stringify({ userId, createdAt: Date.now() })).toString("base64url");
  const signature = createHmac("sha256", db.secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function getUserFromRequest(request) {
  const auth = request.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", db.secret).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return db.users.find((user) => user.id === payload.userId) || null;
  } catch {
    return null;
  }
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  if (!body) return {};
  return JSON.parse(body);
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

async function handleApi(request, response, url) {
  if (request.method === "POST" && url.pathname === "/api/register") {
    const { username, password } = await readJson(request);
    const normalizedUsername = normalizeUsername(username);

    if (normalizedUsername.length < 3) return sendError(response, 400, "Der Nutzername braucht mindestens 3 Zeichen.");
    if (String(password || "").length < 6) return sendError(response, 400, "Das Passwort braucht mindestens 6 Zeichen.");
    if (db.users.some((user) => user.username === normalizedUsername)) {
      return sendError(response, 409, "Dieser Nutzername ist schon vergeben.");
    }

    const passwordData = hashPassword(password);
    const user = {
      id: randomBytes(12).toString("hex"),
      username: normalizedUsername,
      salt: passwordData.salt,
      passwordHash: passwordData.hash,
      data: {},
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb(db);
    return sendJson(response, 201, { token: signToken(user.id), username: user.username });
  }

  if (request.method === "POST" && url.pathname === "/api/login") {
    const { username, password } = await readJson(request);
    const user = db.users.find((item) => item.username === normalizeUsername(username));
    if (!user || !passwordMatches(password, user)) return sendError(response, 401, "Nutzername oder Passwort stimmt nicht.");
    return sendJson(response, 200, { token: signToken(user.id), username: user.username });
  }

  const user = getUserFromRequest(request);
  if (!user) return sendError(response, 401, "Bitte anmelden.");

  if (request.method === "GET" && url.pathname === "/api/me") {
    return sendJson(response, 200, { username: user.username });
  }

  const match = url.pathname.match(/^\/api\/data\/([^/]+)$/);
  if (!match || !sections.has(match[1])) return sendError(response, 404, "Nicht gefunden.");

  const section = match[1];
  if (request.method === "GET") {
    return sendJson(response, 200, { data: user.data?.[section] || null });
  }

  if (request.method === "PUT") {
    const payload = await readJson(request);
    user.data ||= {};
    user.data[section] = payload.data ?? null;
    user.updatedAt = new Date().toISOString();
    saveDb(db);
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === "DELETE") {
    if (user.data) delete user.data[section];
    user.updatedAt = new Date().toISOString();
    saveDb(db);
    return sendJson(response, 200, { ok: true });
  }

  sendError(response, 405, "Methode nicht erlaubt.");
}

function serveStatic(request, response, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(root, requestedPath));
  const relativePath = normalize(requestedPath).replace(/^[/\\]+/, "");

  if (
    !filePath.startsWith(root) ||
    relativePath.startsWith("data\\") ||
    relativePath.startsWith("data/") ||
    ["server.js", "package.json", "package-lock.json"].includes(relativePath)
  ) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}

const db = loadDb();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    serveStatic(request, response, url);
  } catch (error) {
    sendError(response, 500, error.message || "Serverfehler.");
  }
});

server.listen(port, host, () => {
  console.log(`Rasenschach laeuft auf http://localhost:${port}`);
  console.log(`Im gleichen Netzwerk: http://<deine-ip>:${port}`);
});

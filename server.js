const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const generate = require("./api/generate.js");

const publicDir = path.join(__dirname, "public");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };
const maxBodyBytes = 32 * 1024;

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname === "/api/generate") {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBodyBytes) {
        res.writeHead(413).end();
        return;
      }
      chunks.push(chunk);
    }
    try {
      req.body = size ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
    } catch {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "요청 JSON이 올바르지 않습니다." }));
      return;
    }
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (value) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(value));
    };
    await generate(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = path.resolve(publicDir, relative);
  if (!file.startsWith(`${publicDir}${path.sep}`) || !types[path.extname(file)]) {
    res.writeHead(404).end();
    return;
  }
  try {
    const content = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": `${types[path.extname(file)]}; charset=utf-8` });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      res.writeHead(404).end();
    } else {
      console.error("화면 파일을 읽을 수 없습니다.");
      res.writeHead(500).end();
    }
  }
});

server.listen(3000, "127.0.0.1", () => console.log("http://127.0.0.1:3000"));

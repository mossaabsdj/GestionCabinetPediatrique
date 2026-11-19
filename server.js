const { loadEnv } = require("./lib/env-loader");
loadEnv();

const next = require("next");
const path = require("path");
const express = require("express");
const { getUploadsDir, getPublicDir } = require("./lib/uploads");

const app = next({ dev: false, dir: path.join(__dirname, ".") });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();
  console.log("server here");

  const uploadsDir = getUploadsDir();
  const publicDir = getPublicDir();

  // Serve uploads directly from filesystem with no-cache so newly uploaded images appear immediately
  server.use(
    "/uploads",
    express.static(uploadsDir, {
      fallthrough: true,
      maxAge: 0,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Access-Control-Allow-Origin", "*");
      },
    })
  );

  // Serve static public assets
  server.use(express.static(publicDir, { fallthrough: true }));

  server.all("*splat", (req, res) => {
    handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js server running on http://localhost:${port}`);
  });
});

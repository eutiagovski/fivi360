/**
 * Temporary diagnostic: invoke discovery the same way the Functions emulator does.
 * Delete after RC-DIAG-FUNCTIONS-LOAD-1.
 */
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const functionsDir = path.resolve(__dirname);
const bin = path.join(
  functionsDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "firebase-functions.cmd" : "firebase-functions"
);

const child = spawn(bin, [functionsDir], {
  cwd: functionsDir,
  env: {
    ...process.env,
    // Match emulator-ish env without secrets
  },
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

let stdout = "";
let stderr = "";
let port = null;
const started = Date.now();

child.stdout.on("data", (buf) => {
  const s = buf.toString();
  stdout += s;
  process.stdout.write(s);
  const m = s.match(/Serving at port (\d+)/);
  if (m && !port) {
    port = Number(m[1]);
    const readyAt = Date.now() - started;
    console.log(`[diag] server ready in ${readyAt}ms on ${port}`);
    fetchYaml(port);
  }
});

child.stderr.on("data", (buf) => {
  const s = buf.toString();
  stderr += s;
  process.stderr.write(s);
});

function fetchYaml(p) {
  const t0 = Date.now();
  const req = http.get(`http://127.0.0.1:${p}/__/functions.yaml`, (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log(`[diag] yaml status=${res.statusCode} in ${Date.now() - t0}ms`);
      try {
        const parsed = JSON.parse(body);
        console.log(`[diag] endpoints: ${Object.keys(parsed.endpoints || {}).join(", ")}`);
      } catch {
        console.log(`[diag] body preview: ${body.slice(0, 200)}`);
      }
      cleanup(0);
    });
  });
  req.setTimeout(10000, () => {
    console.error(`[diag] YAML FETCH TIMEOUT after 10000ms (same as emulator)`);
    cleanup(1);
  });
  req.on("error", (err) => {
    console.error(`[diag] yaml fetch error: ${err.message}`);
    cleanup(1);
  });
}

function cleanup(code) {
  console.log(`[diag] total elapsed ${Date.now() - started}ms`);
  try {
    child.kill();
  } catch {}
  setTimeout(() => process.exit(code), 200);
}

setTimeout(() => {
  if (!port) {
    console.error(`[diag] never saw Serving at port within 15000ms`);
    console.error(`[diag] stdout:\n${stdout}`);
    console.error(`[diag] stderr:\n${stderr}`);
    cleanup(1);
  }
}, 15000);

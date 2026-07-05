const { spawn } = require("node:child_process");

const processes = [
  {
    name: "api",
    command: process.execPath,
    args: ["api-server.cjs"],
  },
  {
    name: "web",
    command: process.platform === "win32" ? "cmd.exe" : "npm",
    args:
      process.platform === "win32"
        ? ["/c", "npm", "run", "dev:web", "--", "--host", "127.0.0.1", "--port", "5173"]
        : ["run", "dev:web", "--", "--host", "127.0.0.1", "--port", "5173"],
  },
];

const children = processes.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", data => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", data => process.stderr.write(`[${name}] ${data}`));
  child.on("exit", code => {
    if (code && !shuttingDown) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

let shuttingDown = false;

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

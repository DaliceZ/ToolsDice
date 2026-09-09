const processes = [
  Bun.spawn(["bun", "--cwd", "backend", "dev"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }),
  Bun.spawn(["bun", "--cwd", "frontend", "dev"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }),
];

let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill();
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

const exitCode = await Promise.race(processes.map((child) => child.exited));
stop();
await Promise.allSettled(processes.map((child) => child.exited));
process.exit(exitCode);

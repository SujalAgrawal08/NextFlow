import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_ehrjzhvthcepcfkhxjbz",
  runtime: "node",
  logLevel: "log",
  // The max compute duration a single task is allowed to run.
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
});

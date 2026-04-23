// import { defineConfig } from "vitest/config";

// export default defineConfig({
//   test: {
//     globals: true,
//     environment: "node",
//     env: loadEnv(mode, process.cwd(), ""),
//     setupFiles: ["./tests/setup.js"],
//     coverage: {
//       provider: "v8",
//       reporter: ["text", "html"],
//       thresholds: {
//         lines: 80,
//         functions: 80,
//         branches: 80,
//         statements: 80,
//       },
//     },
//   },
// });

import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? "test", process.cwd(), "");

  return {
    test: {
      globals: true,
      environment: "node",
      setupFiles: ["./tests/setup.js"],
      env,
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  };
});

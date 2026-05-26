// One-shot runner for the demo teardown pass.
// Run from cron with:  pnpm tsx scripts/run-teardown.ts

import { runTeardownPass } from "../src/teardown-cron.js";

runTeardownPass()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });

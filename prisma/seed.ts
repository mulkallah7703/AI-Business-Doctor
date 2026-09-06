import { seedDemo } from "../lib/seed";

const reset = process.env.SEED_RESET !== "false";

seedDemo({ reset, disconnect: true })
  .then((result) => {
    if (result.skipped) {
      console.log("Seed skipped (demo org already exists).");
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Backfills real photographs onto catalogue artifacts that don't have one.
//
//   npm run images
//
// Safe to run more than once: it only fills in a picture where the artifact
// currently has none, so anything uploaded by hand is left alone.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Item = require("../models/Item");
const { ARTIFACT_IMAGES } = require("../config/artifactImages");

(async () => {
  await connectDB();

  let updated = 0;
  let skipped = 0;
  let absent = 0;

  for (const [name, image] of Object.entries(ARTIFACT_IMAGES)) {
    const items = await Item.find({ name });
    if (items.length === 0) {
      absent += 1;
      continue;
    }
    for (const item of items) {
      if (item.picture) {
        skipped += 1;
        continue;
      }
      item.picture = image.picture;
      await item.save();
      updated += 1;
    }
  }

  console.log(`Images added: ${updated}`);
  console.log(`Already had a picture, left alone: ${skipped}`);
  console.log(`Named artifacts not in this database: ${absent}`);

  await mongoose.connection.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

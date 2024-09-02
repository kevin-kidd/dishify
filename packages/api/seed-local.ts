const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Define the path to the seed file and set the chunk size for reading
const seedFile = path.join(__dirname, "/seed/seed.sql");
const chunkSize = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Generator function to read the seed file in chunks, ensuring SQL statements are not split
 * @param {string} filePath - Path to the seed file
 * @param {number} chunkSize - Size of each chunk to read
 * @yields {string} Complete SQL statements
 */
function* chunkedReadAtStatementBoundary(filePath: string, chunkSize: number): Generator<string> {
  const fileDescriptor = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(chunkSize);
  let bytesRead: number;
  let position = 0;
  let carryOver = "";

  try {
    while (true) {
      // Read a chunk from the file
      bytesRead = fs.readSync(fileDescriptor, buffer, 0, chunkSize, position);
      if (bytesRead === 0) {
        if (carryOver.trim()) yield carryOver;
        break;
      }
      position += bytesRead;

      // Process the chunk and ensure complete SQL statements
      const chunk = carryOver + buffer.toString("utf8", 0, bytesRead);
      const lastSemicolonIndex = chunk.lastIndexOf(";");

      if (lastSemicolonIndex !== -1) {
        const completeStatements = chunk.slice(0, lastSemicolonIndex + 1);
        carryOver = chunk.slice(lastSemicolonIndex + 1);
        yield completeStatements;
      } else {
        carryOver = chunk;
      }
    }
  } finally {
    fs.closeSync(fileDescriptor);
  }
}

// Process and execute seed data in chunks
let chunkIndex = 0;
for (const chunk of chunkedReadAtStatementBoundary(seedFile, chunkSize)) {
  if (chunk.trim()) {
    chunkIndex++;
    console.log(`Seeding chunk ${chunkIndex}`);

    // Write the chunk to a temporary file
    const tempFile = path.join(__dirname, `/seed/temp_seed_${chunkIndex}.sql`);
    fs.writeFileSync(tempFile, chunk);

    try {
      // Execute the SQL statements using wrangler
      execSync(`wrangler d1 execute dishify_preview --local --file=${tempFile}`, {
        stdio: "inherit",
      });
    } catch (error) {
      console.error(`Error seeding chunk ${chunkIndex}:`, error);
    } finally {
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
    }
  }
}

console.log("Seeding complete");

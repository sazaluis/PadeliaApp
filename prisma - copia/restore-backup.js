const fs = require("fs");
const path = require("path");

const backupPath = path.join(__dirname, "dev.db.backup");
const targetPath = path.join(__dirname, "dev.db");

if (!fs.existsSync(backupPath)) {
  console.error("❌ Backup file not found:", backupPath);
  process.exit(1);
}

// Remove existing DB first
if (fs.existsSync(targetPath)) {
  fs.unlinkSync(targetPath);
}

fs.copyFileSync(backupPath, targetPath);
console.log("✅ Database restored from backup to prisma/dev.db");
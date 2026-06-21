// Run with: npx tsx prisma/cleanup-orphans.ts
// Requires: npm install -D tsx (or use: node --loader ts-node/esm prisma/cleanup-orphans.ts)

import { PrismaClient } from "@prisma/client";

const prismadb = new PrismaClient();

async function cleanup() {
  // Find all PLAYER users that don't have a player profile (failed creations)
  const orphans = await prismadb.user.findMany({
    where: {
      role: "PLAYER",
      player: null,
    },
    select: { id: true, email: true, name: true, surname: true, createdAt: true },
  });

  if (orphans.length === 0) {
    console.log("✅ No se encontraron usuarios huérfanos.");
    return;
  }

  console.log(`\n🔍 Se encontraron ${orphans.length} usuarios huérfanos:\n`);
  orphans.forEach((u) => {
    console.log(`   - ${u.email} (${u.name} ${u.surname}) creado: ${u.createdAt}`);
  });

  // Delete them
  const orphanIds = orphans.map((o) => o.id);
  const result = await prismadb.user.deleteMany({
    where: { id: { in: orphanIds } },
  });
  console.log(`\n✅ Eliminados ${result.count} usuarios huérfanos.`);
}

cleanup()
  .catch((e) => console.error("❌ Error:", e))
  .finally(() => prismadb.$disconnect());

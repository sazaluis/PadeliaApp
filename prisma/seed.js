const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");
  const passwordHash = await bcrypt.hash("password123", 12);

  // Admin
  const admin = await prisma.user.create({
    data: { name: "Admin", surname: "Global", email: "admin@padelia.com", passwordHash, role: "GLOBAL_ADMIN" },
  });
  console.log("✅ Admin:", admin.email);

  // CLUB 1: Padel Club Barcelona
  const club1 = await prisma.club.create({
    data: { name: "Padel Club Barcelona", slug: "padel-club-barcelona", city: "Barcelona", address: "Calle Deportes 123", phone: "+34 934 567 890", email: "info@padelclubbarcelona.com" },
  });
  console.log("✅ Club 1:", club1.name);

  const manager1 = await prisma.user.create({
    data: { name: "María", surname: "García", email: "manager1@padelia.com", passwordHash, role: "CLUB_MANAGER", clubId: club1.id },
  });
  console.log("✅ Manager 1:", manager1.email);

  const coachUser1 = await prisma.user.create({
    data: { name: "Carlos", surname: "Ruiz", email: "coach1@padelia.com", passwordHash, role: "COACH", clubId: club1.id },
  });
  const coach1 = await prisma.coach.create({
    data: { userId: coachUser1.id, clubId: club1.id, specialization: "Táctica y técnica", experience: 8 },
  });
  console.log("✅ Coach 1:", coachUser1.email);

  // Teams for Club 1 - 2 teams
  const team1A = await prisma.team.create({ data: { name: "Barcelona A", category: "MALE", level: "Senior", clubId: club1.id, coachId: coach1.id } });
  const team1B = await prisma.team.create({ data: { name: "Barcelona B", category: "MALE", level: "Senior B", clubId: club1.id, coachId: coach1.id } });
  console.log("✅ Teams Club 1 created");

  // 3 Players for each team in Club 1 (team1A: 1-3, team1B: 4-6)
  for (let i = 0; i < 6; i++) {
    const teamId = i < 3 ? team1A.id : team1B.id;
    const numInTeam = i + 1;
    const user = await prisma.user.create({
      data: { name: "Jugador1-" + numInTeam, surname: "Barcelona", email: "bclb1-pl" + numInTeam + "@padelia.com", passwordHash, role: "PLAYER", clubId: club1.id },
    });
    await prisma.player.create({
      data: { userId: user.id, clubId: club1.id, teamId: teamId, dominantHand: "RIGHT" },
    });
  }

  // CLUB 2: Padel Club Madrid
  const club2 = await prisma.club.create({
    data: { name: "Padel Club Madrid", slug: "padel-club-madrid", city: "Madrid", address: "Avenida Tenis 456", phone: "+34 914 567 890", email: "info@padelclubmadrid.com" },
  });
  console.log("✅ Club 2:", club2.name);

  const manager2 = await prisma.user.create({
    data: { name: "Ana", surname: "López", email: "manager2@padelia.com", passwordHash, role: "CLUB_MANAGER", clubId: club2.id },
  });
  console.log("✅ Manager 2:", manager2.email);

  const coachUser2 = await prisma.user.create({
    data: { name: "Elena", surname: "Martín", email: "coach2@padelia.com", passwordHash, role: "COACH", clubId: club2.id },
  });
  const coach2 = await prisma.coach.create({
    data: { userId: coachUser2.id, clubId: club2.id, specialization: "Físico y táctica", experience: 5 },
  });
  console.log("✅ Coach 2:", coachUser2.email);

  // Teams for Club 2 - 2 teams
  const team2A = await prisma.team.create({ data: { name: "Madrid A", category: "MALE", level: "Senior", clubId: club2.id, coachId: coach2.id } });
  const team2B = await prisma.team.create({ data: { name: "Madrid Femenino", category: "FEMALE", level: "Senior", clubId: club2.id, coachId: coach2.id } });
  console.log("✅ Teams Club 2 created");

  // 3 Players for each team in Club 2 (team2A: 1-3, team2B: 4-6)
  for (let i = 0; i < 6; i++) {
    const teamId = i < 3 ? team2A.id : team2B.id;
    const numInTeam = i + 1;
    const user = await prisma.user.create({
      data: { name: "Jugador2-" + numInTeam, surname: "Madrid", email: "bclm2-pl" + numInTeam + "@padelia.com", passwordHash, role: "PLAYER", clubId: club2.id },
    });
    await prisma.player.create({
      data: { userId: user.id, clubId: club2.id, teamId: teamId, gender: teamId === team2A.id ? "MALE" : "FEMALE", dominantHand: "RIGHT" },
    });
  }

  console.log("✅ Players created");
  console.log("\n🎉 Seed completed!");
  console.log("\n📧 Test accounts:");
  console.log("  Admin:    admin@padelia.com / password123");
  console.log("  Manager 1: manager1@padelia.com / password123");
  console.log("  Manager 2: manager2@padelia.com / password123");
  console.log("  Coach 1:  coach1@padelia.com / password123");
  console.log("  Coach 2:  coach2@padelia.com / password123");
}

main().catch(function(e) { console.error(e); process.exit(1); }).finally(async function() { await prisma.$disconnect(); });
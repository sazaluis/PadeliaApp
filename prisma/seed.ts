import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // Admin
  const admin = await prisma.user.create({
    data: { name: "Admin", surname: "Global", email: "admin@padelia.com", passwordHash, role: "GLOBAL_ADMIN" },
  });
  console.log("✅ Admin:", admin.email);

// Club 1
  const club1 = await prisma.club.create({
    data: { name: "Padel Club Barcelona", slug: "padel-club-barcelona", city: "Barcelona", address: "Calle Deportes 123", phone: "+34 934 567 890", email: "info@padelclubbarcelona.com" },
  });

  const manager1 = await prisma.user.create({
    data: { name: "María", surname: "García", email: "manager1@padelia.com", passwordHash, role: "CLUB_MANAGER", clubId: club1.id },
  });
  console.log("✅ Manager 1:", manager1.email);

  // Coach 1
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

  // 3 Players for each team in Club 1
  for (let i = 0; i < 6; i++) {
    const teamId = i < 3 ? team1A.id : team1B.id;
    const numInTeam = i < 3 ? (i + 1) : (i - 2);
    const user = await prisma.user.create({
      data: { name: `Jugador1-${teamId === team1A.id ? 'A' : 'B'}${numInTeam}`, surname: `Barcelona`, email: `player1-${teamId === team1A.id ? 'a' : 'b'}${numInTeam}@padelia.com`, passwordHash, role: "PLAYER", clubId: club1.id },
    });
    await prisma.player.create({
      data: { userId: user.id, clubId: club1.id, teamId: teamId, dominantHand: "RIGHT" },
    });
  }

  // Club 2
  const club2 = await prisma.club.create({
    data: { name: "Padel Club Madrid", slug: "padel-club-madrid", city: "Madrid", address: "Avenida Tenis 456", phone: "+34 914 567 890", email: "info@padelclubmadrid.com" },
  });

  const manager2 = await prisma.user.create({
    data: { name: "Ana", surname: "López", email: "manager2@padelia.com", passwordHash, role: "CLUB_MANAGER", clubId: club2.id },
  });
  console.log("✅ Manager 2:", manager2.email);

  // Coach 2
  const coachUser2 = await prisma.user.create({
    data: { name: "Elena", surname: "Martín", email: "coach2@padelia.com", passwordHash, role: "COACH", clubId: club2.id },
  });
  const coach2 = await prisma.coach.create({
    data: { userId: coachUser2.id, clubId: club2.id, specialization: "Físico y táctica", experience: 5 },
  });
  console.log("✅ Coach 2:", coachUser2.email);

  // Teams for Club 2 - 2 teams
  const team2A = await prisma.team.create({ data: { name: "Madrid A", category: "MALE", level: "Senior", clubId: club2.id, coachId: coach2.id } });
  const team2B = await prisma.team.create({ data: { name: "Madrid B", category: "FEMALE", level: "Senior", clubId: club2.id, coachId: coach2.id } });
  console.log("✅ Teams Club 2 created");

  // 3 Players for each team in Club 2
  for (let i = 0; i < 6; i++) {
    const teamId = i < 3 ? team2A.id : team2B.id;
    const numInTeam = i < 3 ? (i + 1) : (i - 2);
    const category = teamId === team2A.id ? "MALE" : "FEMALE";
    const user = await prisma.user.create({
      data: { name: `Jugador2-${teamId === team2A.id ? 'A' : 'B'}${numInTeam}`, surname: `Madrid`, email: `player2-${teamId === team2A.id ? 'a' : 'b'}${numInTeam}@padelia.com`, passwordHash, role: "PLAYER", clubId: club2.id },
    });
    await prisma.player.create({
      data: { userId: user.id, clubId: club2.id, teamId: teamId, gender: category, dominantHand: "RIGHT" },
    });
  }
  // Season & League for Club 1
  const season = await prisma.season.create({
    data: { name: "Temporada 2024-2025", year: 2024, startDate: new Date("2024-09-01"), endDate: new Date("2025-06-30"), clubId: club1.id },
  });
  const league = await prisma.league.create({
    data: { name: "Liga Senior Masculina", category: "MALE", level: "Senior", maxTeams: 8, seasonId: season.id },
  });
  console.log("✅ Season & League created");

  // Standings for local teams
  for (const t of [team1A, team1B]) {
    await prisma.standing.create({ data: { leagueId: league.id, seasonId: season.id, teamId: t.id, position: 0 } });
  }

  // Matchdays
  for (let i = 1; i <= 4; i++) {
    const matchday = await prisma.matchday.create({
      data: { number: i, name: `Jornada ${i}`, startDate: new Date(`2024-10-${i * 7 + 7}`), endDate: new Date(`2024-10-${i * 7 + 8}`), leagueId: league.id },
    });
    if (i <= 2) {
      await prisma.match.create({
        data: { matchDate: new Date(`2024-10-${i * 7 + 7}`), matchTime: "10:00", court: "Pista 1", status: "COMPLETED", homeTeamId: team1A.id, awayTeamId: team1B.id, matchdayId: matchday.id },
      });
    }
  }
  console.log("✅ Matchdays & Matches created");

  // Trainings for team1A
  const trainingTitles = ["Táctico", "Técnico", "Físico", "Saque", "Remate"];
  for (let i = 0; i < 3; i++) {
    const training = await prisma.training.create({
      data: { title: `Entrenamiento ${trainingTitles[i]}`, description: `Sesión de ${trainingTitles[i].toLowerCase()}`, date: new Date(`2024-06-${10 + i * 2}`), startTime: "18:00", endTime: "20:00", duration: 120, facility: "Pista Cubierta", objectives: "Mejorar rendimiento", teamId: team1A.id, coachId: coach1.id },
    });
  }
  console.log("✅ Trainings created");

  // Notifications for first player
  const firstPlayer = await prisma.player.findFirst({ where: { clubId: club1.id } });
  if (firstPlayer) {
    await prisma.notification.create({ data: { title: "Bienvenido a PadelIA", message: "Tu cuenta ha sido creada correctamente", type: "GENERAL", userId: firstPlayer.userId } });
    console.log("✅ Notifications created");
  }

  console.log("\n🎉 Seed completed!");
  console.log("\n📧 Test accounts:");
  console.log("  Admin:    admin@padelia.com / password123");
  console.log("  Manager:  manager@padelia.com / password123");
  console.log("  Coach:    coach@padelia.com / password123");
  console.log("  Players:  player1@padelia.com - player8@padelia.com / password123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
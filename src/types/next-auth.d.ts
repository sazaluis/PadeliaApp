import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      clubId?: string;
      playerId?: string;
      coachId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    clubId?: string;
    playerId?: string;
    coachId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    clubId?: string;
    playerId?: string;
    coachId?: string;
  }
}
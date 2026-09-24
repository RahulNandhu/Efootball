import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "USER";
    teamName: string;
    photoUrl: string;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
      teamName: string;
      photoUrl: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "USER";
    teamName: string;
    photoUrl: string;
  }
}

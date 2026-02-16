import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userType: "USER" | "BIZ" | "AD" | "ADMIN";
      nickname?: string;
      email?: string | null;
      image?: string | null;
      role?: string;
      grade?: string;
      bizName?: string;
      hasSeekAccess?: boolean;
      isApproved?: boolean;
    };
  }

  interface User {
    userType: "USER" | "BIZ" | "AD" | "ADMIN";
    nickname?: string;
    role?: string;
    grade?: string;
    bizName?: string;
    hasSeekAccess?: boolean;
    isApproved?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: "USER" | "BIZ" | "AD" | "ADMIN";
    nickname?: string;
    role?: string;
    grade?: string;
    bizName?: string;
    hasSeekAccess?: boolean;
    isApproved?: boolean;
  }
}

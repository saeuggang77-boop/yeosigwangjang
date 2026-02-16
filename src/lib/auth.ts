import { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    // ==========================================
    // 소셜 로그인 (일반회원 - 종사자)
    // ==========================================
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),

    // ==========================================
    // 이메일 로그인 (업소회원 + 광고업체)
    // ==========================================
    CredentialsProvider({
      id: "biz-login",
      name: "업소회원 로그인",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const bizUser = await prisma.bizUser.findUnique({
          where: { email: credentials.email },
        });
        if (!bizUser) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          bizUser.password
        );
        if (!isValid) return null;

        return {
          id: bizUser.id,
          email: bizUser.email,
          userType: "BIZ" as const,
          bizName: bizUser.bizName,
          hasSeekAccess: bizUser.hasSeekAccess,
        };
      },
    }),

    CredentialsProvider({
      id: "ad-login",
      name: "광고업체 로그인",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adUser = await prisma.adUser.findUnique({
          where: { email: credentials.email },
        });
        if (!adUser) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          adUser.password
        );
        if (!isValid) return null;

        return {
          id: adUser.id,
          email: adUser.email,
          userType: "AD" as const,
          isApproved: adUser.isApproved,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // 소셜 로그인: User 테이블에 upsert
      if (account && account.type === "oauth") {
        const providerField = getProviderField(account.provider);
        if (!providerField) return false;

        const existingUser = await prisma.user.findFirst({
          where: { [providerField]: account.providerAccountId },
        });

        if (!existingUser) {
          // 신규 유저 → 닉네임 설정 필요 (onboarding 페이지로 리다이렉트)
          // 일단 임시 닉네임으로 생성
          const tempNickname = `여시_${Date.now().toString(36)}`;
          const newUser = await prisma.user.create({
            data: {
              [providerField]: account.providerAccountId,
              email: user.email,
              nickname: tempNickname,
              profileImage: user.image,
            },
          });
          user.id = newUser.id;
          user.userType = "USER";
          user.nickname = newUser.nickname;
          user.role = newUser.role;
          user.grade = newUser.grade;
        } else {
          user.id = existingUser.id;
          user.userType =
            existingUser.role === "ADMIN" ? "ADMIN" : "USER";
          user.nickname = existingUser.nickname;
          user.role = existingUser.role;
          user.grade = existingUser.grade;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.nickname = user.nickname;
        token.role = user.role;
        token.grade = user.grade;
        token.bizName = user.bizName;
        token.hasSeekAccess = user.hasSeekAccess;
        token.isApproved = user.isApproved;
      }
      // session.update() 호출 시 닉네임 갱신
      if (trigger === "update" && updateData?.nickname) {
        token.nickname = updateData.nickname;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.userType = token.userType;
      session.user.nickname = token.nickname;
      session.user.role = token.role;
      session.user.grade = token.grade;
      session.user.bizName = token.bizName;
      session.user.hasSeekAccess = token.hasSeekAccess;
      session.user.isApproved = token.isApproved;
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },

  secret: process.env.NEXTAUTH_SECRET,
};

function getProviderField(
  provider: string
): "kakaoId" | "naverId" | "googleId" | "appleId" | null {
  switch (provider) {
    case "kakao":
      return "kakaoId";
    case "naver":
      return "naverId";
    case "google":
      return "googleId";
    case "apple":
      return "appleId";
    default:
      return null;
  }
}

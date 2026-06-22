import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import type { NextAuthConfig } from "next-auth"

const config: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers: [
    Google,
    GitHub,
    // TODO: 카카오 OAuth — AUTH_KAKAO_ID / AUTH_KAKAO_SECRET 설정 후 활성화
    // {
    //   id: "kakao",
    //   name: "Kakao",
    //   type: "oauth",
    //   authorization: {
    //     url: "https://kauth.kakao.com/oauth/authorize",
    //     params: { scope: "profile_nickname profile_image account_email" },
    //   },
    //   token: "https://kauth.kakao.com/oauth/token",
    //   userinfo: "https://kapi.kakao.com/v2/user/me",
    //   profile(profile) {
    //     return {
    //       id: String(profile.id),
    //       name: profile.kakao_account?.profile?.nickname ?? null,
    //       email: profile.kakao_account?.email ?? null,
    //       image: profile.kakao_account?.profile?.profile_image_url ?? null,
    //     }
    //   },
    //   clientId: process.env.AUTH_KAKAO_ID,
    //   clientSecret: process.env.AUTH_KAKAO_SECRET,
    // },
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = (user as { role?: string }).role ?? "USER"
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)

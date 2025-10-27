import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        clienteId: { label: "Cliente ID", type: "text", required: false },
      },
      async authorize(credentials) {
        console.log("🔍 Credenciais recebidas:", credentials); // Debug completo (veja email/password no terminal)

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Credenciais incompletas (email/password ausentes)");
          throw new Error("Email e senha são obrigatórios"); // Throw para mensagem no frontend
        }

        try {
          console.log("🔍 Buscando usuário por email:", credentials.email);

          const usuario = await prisma.usuario.findFirst({
            where: {
              email: credentials.email,
              ativo: true,
            },
            include: {
              cliente: true,
              aluno: true,
            },
          });

          if (!usuario) {
            console.log(
              "❌ Usuário não encontrado ou inativo:",
              credentials.email
            );
            throw new Error("Usuário não encontrado ou inativo");
          }

          // Valida clienteId só se enviado E role !== ADMIN/SUPERADMIN (admins acessam tudo)
          const clienteId = credentials.clienteId as string | undefined;
          if (
            clienteId &&
            usuario.role !== "ADMIN" &&
            usuario.role !== "SUPERADMIN" &&
            usuario.clienteId !== clienteId
          ) {
            console.log(
              "❌ Cliente ID não corresponde:",
              clienteId,
              "vs",
              usuario.clienteId
            );
            throw new Error("Cliente ID inválido");
          }

          console.log(
            "✅ Usuário encontrado:",
            usuario.email,
            "Role:",
            usuario.role
          );

          const senhaValida = await compare(
            credentials.password,
            usuario.senha
          );

          if (!senhaValida) {
            console.log("❌ Senha incorreta para:", credentials.email);
            throw new Error("Senha incorreta");
          }

          console.log(
            "✅ Autenticação bem-sucedida:",
            usuario.email,
            "Role:",
            usuario.role
          );

          // Return com basics + custom props (as any para TS ignorar extras)
          const user = {
            id: usuario.id!, // Non-null assertion (id sempre presente)
            name: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            clienteId: usuario.clienteId,
            cliente: usuario.cliente?.nome,
            aluno: usuario.aluno, // TS ignora 'aluno' com as any
          } as any; // Assertion para custom props sem erro 2339

          return user;
        } catch (error) {
          console.error("❌ Erro na autenticação:", error);
          throw new Error("Erro interno na autenticação"); // Throw para frontend
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
        (token as any).clienteId = user.clienteId; // as any para custom
        (token as any).cliente = user.cliente;
        (token as any).aluno = user.aluno; // Resolve erro principal
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        (session.user as any).clienteId = token.clienteId; // Consistente
        (session.user as any).cliente = token.cliente;
        (session.user as any).aluno = token.aluno;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

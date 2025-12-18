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
        const senha = credentials?.password || (credentials as any)?.senha;

        if (!credentials?.email || !senha) {
          throw new Error("Email e senha são obrigatórios");
        }

        try {
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
            throw new Error("Usuário não encontrado ou inativo");
          }

          // 🔐 valida a senha
          const senhaValida = await compare(senha, usuario.senha);
          if (!senhaValida) {
            throw new Error("Senha incorreta");
          }

          const clienteId = credentials.clienteId as string | undefined;

          // 🌐 LOGIN SUPERADMIN (painel global) → não tem clienteId
          if (!clienteId) {
            if (usuario.role !== "SUPERADMIN") {
              throw new Error("Apenas SuperAdmin pode acessar este painel");
            }
            // SUPERADMIN logando no /login-superadmin → OK
          } else {
            // 🏢 LOGIN POR CARD (clienteId vindo da URL)
            if (
              usuario.role !== "SUPERADMIN" && // superadmin entra em qualquer card
              usuario.clienteId !== clienteId // demais só no próprio cliente
            ) {
              throw new Error("Usuário não pertence a esta academia");
            }
          }

          const user = {
            id: usuario.id,
            name: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            clienteId: usuario.clienteId,
            cliente: usuario.cliente?.nome,
            aluno: usuario.aluno,
          } as any;

          return user;
        } catch (error) {
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
        (token as any).clienteId = user.clienteId;
        (token as any).cliente = user.cliente;
        (token as any).aluno = user.aluno;

        // buscar permissões (somente ADMIN / PERSONAL / USER)
        if (user.role !== "SUPERADMIN" && user.role !== "ALUNO") {
          try {
            const permissoes = await prisma.permissao.findMany({
              where: { usuarioId: user.id },
              select: {
                recurso: true,
                ler: true,
                criar: true,
                editar: true,
                deletar: true,
              },
            });
            (token as any).permissoes = permissoes;
          } catch (error) {
            console.error("❌ Erro ao buscar permissões no login:", error);
            (token as any).permissoes = [];
          }
        } else {
          (token as any).permissoes = null;
        }
      }

      // atualizar permissões quando session.update() é chamado
      if (
        trigger === "update" &&
        token.id &&
        token.role !== "SUPERADMIN" &&
        token.role !== "ALUNO"
      ) {
        try {
          const permissoes = await prisma.permissao.findMany({
            where: { usuarioId: token.id as string },
            select: {
              recurso: true,
              ler: true,
              criar: true,
              editar: true,
              deletar: true,
            },
          });
          (token as any).permissoes = permissoes;
        } catch (error) {
          console.error("❌ Erro ao recarregar permissões:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        (session.user as any).clienteId = token.clienteId;
        (session.user as any).cliente = token.cliente;
        (session.user as any).aluno = token.aluno;
        (session.user as any).permissoes = token.permissoes;
      }
      return session;
    },

    // ❌ Removemos o redirect porque NÃO funciona com token e causa erro
  },
  secret: process.env.NEXTAUTH_SECRET,
};

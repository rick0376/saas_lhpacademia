import { DefaultSession } from "next-auth";

// ✅ Declarações de tipos: Extensão do NextAuth (sem imports no arquivo)
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      role?: string;
      clienteId?: string; // ✅ Opcional e consistente
      cliente?: string; // ✅ Opcional e consistente
      aluno?: any; // ✅ Opcional (para schema Prisma)
    } & DefaultSession["user"]; // ✅ Mantém defaults (name, email, image)
  }

  interface JWT {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
    clienteId?: string; // ✅ Opcional (resolve assignable)
    cliente?: string; // ✅ Opcional (resolve assignable)
    aluno?: any;
  }

  interface User {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
    clienteId?: string; // ✅ Opcional e consistente
    cliente?: string; // ✅ Opcional e consistente
    aluno?: any;
  }
}

// ✅ Para adapters ou providers custom (se usar no futuro)
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    clienteId?: string;
    cliente?: string;
    aluno?: any;
  }
}

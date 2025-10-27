import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      clienteId: string;
      cliente: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    clienteId: string;
    cliente: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    clienteId: string;
    cliente: string;
  }
}

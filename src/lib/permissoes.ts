import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function verificarPermissao(
  usuarioId: string,
  recurso: string,
  acao: "criar" | "ler" | "editar" | "deletar"
): Promise<boolean> {
  const session = await getServerSession(authOptions);

  // SUPERADMIN tem acesso total
  if (session?.user?.role === "SUPERADMIN") {
    return true;
  }

  const permissao = await prisma.permissao.findUnique({
    where: {
      usuarioId_recurso: {
        usuarioId,
        recurso,
      },
    },
  });

  if (!permissao) {
    return false; // Sem permissão = negado
  }

  return permissao[acao];
}

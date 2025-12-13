import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // ======================================
  // 1️⃣ ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
  // ======================================
  const publicRoutes = ["/", "/login", "/login-superadmin", "/alunos/login"];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) return NextResponse.next();

  // ======================================
  // 2️⃣ SUPERADMIN → deve acessar o dashboard normal
  // ======================================
  if (token?.role === "SUPERADMIN") {
    // SUPERADMIN nunca acessa a área do aluno
    if (pathname.startsWith("/alunos")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // SUPERADMIN pode acessar qualquer /dashboard
    // e qualquer rota do sistema
    return NextResponse.next();
  }

  // ======================================
  // 3️⃣ ÁREA DO ALUNO → /alunos/**
  // ======================================
  if (pathname.startsWith("/alunos")) {
    // Não autenticado → login do aluno
    if (!token) {
      return NextResponse.redirect(new URL("/alunos/login", request.url));
    }

    // Apenas ALUNO pode acessar o PCW
    if (token.role !== "ALUNO") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // ======================================
  // 4️⃣ ÁREA ADMIN /dashboard/**
  // ======================================
  if (pathname.startsWith("/dashboard")) {
    // Não logado → voltar para home
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Aluno tentando acessar dashboard → volta para PCW
    if (token.role === "ALUNO") {
      return NextResponse.redirect(new URL("/alunos/dashboard", request.url));
    }

    // ADMIN / PERSONAL / USER → normalmente permitido
    // Mas algumas rotas são EXCLUSIVAS do SUPERADMIN
    const superAdminOnlyRoutes = ["/dashboard/permissoes"];

    if (
      superAdminOnlyRoutes.some((route) => pathname.startsWith(route)) &&
      token.role !== "SUPERADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/dashboard?erro=sem-permissao", request.url)
      );
    }

    return NextResponse.next();
  }

  // ======================================
  // 5️⃣ QUALQUER OUTRA ROTA → liberar
  // ======================================
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};

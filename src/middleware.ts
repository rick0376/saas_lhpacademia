import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // ✅ ROTAS PÚBLICAS (não precisam de autenticação)
  const publicRoutes = [
    "/",
    "/login",
    "/login-superadmin",
    "/alunos/login", // Login do aluno é público
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ✅ ROTAS DO ALUNO (/alunos/*)
  if (pathname.startsWith("/alunos")) {
    // Não está autenticado → redireciona para login do aluno
    if (!token) {
      return NextResponse.redirect(new URL("/alunos/login", request.url));
    }

    // Está autenticado mas não é ALUNO → bloqueia
    if (token.role !== "ALUNO") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // É ALUNO → permite acesso
    return NextResponse.next();
  }

  // ✅ ROTAS DO DASHBOARD (/dashboard/*)
  if (pathname.startsWith("/dashboard")) {
    // Não está autenticado → redireciona para home
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // É ALUNO tentando acessar dashboard admin → bloqueia
    if (token.role === "ALUNO") {
      return NextResponse.redirect(new URL("/alunos/dashboard", request.url));
    }

    // ✅ ROTAS RESTRITAS PARA SUPERADMIN
    const superAdminRoutes = [
      "/dashboard/clientes",
      "/dashboard/usuarios",
      "/dashboard/permissoes",
    ];

    const isSuperAdminRoute = superAdminRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isSuperAdminRoute && token.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // ✅ ALUNO NÃO PODE ACESSAR:
    // - Biblioteca de exercícios (todos podem ver)
    // - Treinos de outros alunos
    // - Usuários
    const blockedForAluno = ["/dashboard/usuarios", "/dashboard/clientes"];

    if (
      token.role === "ALUNO" &&
      blockedForAluno.some((route) => pathname.startsWith(route))
    ) {
      return NextResponse.redirect(new URL("/alunos/dashboard", request.url));
    }

    // ADMIN e SUPERADMIN → permite acesso
    return NextResponse.next();
  }

  // Outras rotas → permite
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

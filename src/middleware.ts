import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // ✅ ROTAS PÚBLICAS
  const publicRoutes = ["/", "/login", "/login-superadmin", "/alunos/login"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ✅ ROTAS DO ALUNO (/alunos/*)
  if (pathname.startsWith("/alunos")) {
    if (!token) {
      return NextResponse.redirect(new URL("/alunos/login", request.url));
    }

    if (token.role !== "ALUNO") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // ✅ ROTAS DO DASHBOARD (/dashboard/*)
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (token.role === "ALUNO") {
      return NextResponse.redirect(new URL("/alunos/dashboard", request.url));
    }

    // ✅ ROTAS APENAS PARA SUPERADMIN
    const superAdminOnlyRoutes = [
      "/dashboard/clientes",
      "/dashboard/permissoes",
    ];

    const isSuperAdminOnlyRoute = superAdminOnlyRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isSuperAdminOnlyRoute && token.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // ✅ /dashboard/usuarios permite SUPERADMIN e ADMIN
    // Testando o commit

    // ADMIN e SUPERADMIN → permite acesso
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};

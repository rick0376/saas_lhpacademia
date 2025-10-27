export const checkPermission = (
  userRole: string,
  resource: string,
  action: "criar" | "ler" | "editar" | "deletar"
): boolean => {
  // SuperAdmin tem todas as permissões
  if (userRole === "SUPERADMIN") return true;

  // Admin tem permissões de criar, ler e editar
  if (userRole === "ADMIN") {
    return action !== "deletar";
  }

  // User só pode ler
  if (userRole === "USER") {
    return action === "ler";
  }

  return false;
};

export const canAccessRoute = (userRole: string, route: string): boolean => {
  const publicRoutes = ["/login"];

  if (publicRoutes.includes(route)) return true;

  const adminRoutes = ["/dashboard/permissoes"];

  if (adminRoutes.includes(route)) {
    return userRole === "SUPERADMIN" || userRole === "ADMIN";
  }

  return true;
};

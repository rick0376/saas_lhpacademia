-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "clienteId" TEXT,
    "role" "Role" NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_logs_clienteId_createdAt_idx" ON "login_logs"("clienteId", "createdAt");

-- CreateIndex
CREATE INDEX "login_logs_usuarioId_createdAt_idx" ON "login_logs"("usuarioId", "createdAt");

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

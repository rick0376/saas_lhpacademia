"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import Link from "next/link";

export default function LoginSuperAdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "admin@academia.com",
    senha: "admin123",
    clienteId: "cliente-inicial-001",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        senha: formData.senha,
        clienteId: formData.clienteId,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciais inválidas");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.logoCircle}>🔑</div>
          </div>
          <h1 className={styles.title}>Acesso SuperAdmin</h1>
          <p className={styles.subtitle}>
            Login direto com credenciais de administrador
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <Input
            label="ID do Cliente"
            type="text"
            name="clienteId"
            placeholder="cliente-inicial-001"
            value={formData.clienteId}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="admin@academia.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Senha"
            type="password"
            name="senha"
            placeholder="••••••••"
            value={formData.senha}
            onChange={handleChange}
            required
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Entrando..." : "Entrar como SuperAdmin"}
          </Button>
        </form>

        <div className={styles.footer}>
          <Link href="/" className={styles.backLink}>
            ← Voltar para seleção de clientes
          </Link>
        </div>
      </div>
    </div>
  );
}

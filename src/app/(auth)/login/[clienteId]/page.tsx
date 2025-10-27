"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import styles from "./styles.module.scss";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params.clienteId as string;

  const [formData, setFormData] = useState({
    email: "admin@academia.com",
    senha: "admin123",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Debug: Log o que envia (veja no browser console)
    const payload = {
      email: formData.email.trim(),
      password: formData.senha, // Mapeia senha para password
      clienteId,
    };
    console.log("📤 Payload para signIn:", payload);

    try {
      const result = await signIn("credentials", {
        email: formData.email.trim(), // Trim para evitar espaços
        password: formData.senha, // ✅ Fix: Envia como 'password' (não 'senha')
        clienteId,
        redirect: false,
      });

      console.log("📥 Result signIn:", result); // Debug resposta

      if (result?.error) {
        setError(result.error || "Email ou senha inválidos");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Erro no login:", err);
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
            <div className={styles.logoCircle}>S</div>
          </div>
          <h1 className={styles.title}>Bem-vindo de volta!</h1>
          <p className={styles.subtitle}>Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 5L10 10L17 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="2"
                  y="4"
                  width="16"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
          />

          <Input
            label="Senha"
            type="password"
            name="senha"
            placeholder="••••••••"
            value={formData.senha}
            onChange={handleChange}
            required
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="9"
                  width="14"
                  height="9"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M6 9V6C6 3.79086 7.79086 2 10 2C12.2091 2 14 3.79086 14 6V9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>Não tem uma conta? Contate o administrador.</p>
          <Link href="/" className={styles.backLink}>
            ← Voltar para lista de clientes
          </Link>
        </div>
      </div>
    </div>
  );
}

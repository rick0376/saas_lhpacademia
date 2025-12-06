"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import styles from "./styles.module.scss";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params.clienteId as string;
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    email: "admin@lhp.com",
    senha: "123456",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*controlar senha*/
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  /*---------------------*/

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email.trim(),
        password: formData.senha,
        clienteId,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || "Email ou senha inválidos");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Login bem-sucedido
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  // useEffect para redirecionar após login bem-sucedido
  useEffect(() => {
    if (session?.user) {
      if (session.user.role === "ALUNO") {
        router.push("/alunos/dashboard");
      } else if (
        session.user.role === "ADMIN" ||
        session.user.role === "SUPERADMIN"
      ) {
        router.push("/dashboard");
      }
    }
  }, [session, router]);

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
            placeholder="admin@academia.com"
            value={formData.email}
            onChange={handleChange}
            required
            icon={<Mail size={18} />}
          />

          <div className={styles.passwordWrapper}>
            <Input
              label="Senha"
              type={showPassword ? "text" : "password"}
              name="senha"
              placeholder="••••••••"
              value={formData.senha}
              onChange={handleChange}
              required
              icon={<Lock size={18} />}
            />

            <button
              type="button"
              onClick={toggleShowPassword}
              className={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

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

// src/app/(auth)/login-superadmin/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import Link from "next/link";
import { Mail, Eye, EyeOff, Lock } from "lucide-react";

export default function LoginSuperAdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "henrique@lhp.com",
    senha: "123456",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*controlar senha*/
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.senha,
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

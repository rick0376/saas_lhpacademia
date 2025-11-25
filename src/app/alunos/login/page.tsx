"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity, LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import styles from "./styles.module.scss";
import { Input } from "@/components/ui/Input/Input";

export default function AlunoLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha incorretos");
        setLoading(false);
        return;
      }

      // Redireciona para o dashboard do aluno
      router.push("/alunos/dashboard");
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <Activity size={40} className={styles.logo} />
          </div>
          <h1 className={styles.title}>Área do Aluno</h1>
          <p className={styles.subtitle}>
            Acesse seus treinos e acompanhe sua evolução
          </p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error}>
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="admin@academia.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            icon={<Mail size={18} />}
          />

          {/* Senha com olhinho */}
          <div className={styles.passwordWrapper}>
            <Input
              label="Senha"
              type={showPassword ? "text" : "password"}
              name="password" // se quiser idêntico ao outro, pode usar "senha"
              placeholder="••••••••"
              value={formData.password} // se mudar o name para "senha", mude aqui também
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
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

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Esqueceu sua senha? Entre em contato com seu personal.
          </p>
        </div>
      </div>
    </div>
  );
}

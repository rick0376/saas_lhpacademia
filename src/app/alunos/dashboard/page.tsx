"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Aluno } from "@/types";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import styles from "./styles.module.scss";
import { User, Heart, Ruler, Dumbbell, Calendar } from "lucide-react";

// Interface AlunoData (mantida com fallback name)
interface AlunoData {
  id: string;
  nome: string; // Pode ser undefined se API não envia (fallback no adjustedData)
  foto?: string | null;
  objetivo?: string | null;
  treinosAtivos: number;
  ultimaMedida?: {
    peso?: number | null;
  } | null;
  avaliacoes: number;
  proximoTreino?: {
    data: string;
  } | null;
  name?: string; // Fallback se API usa 'name' em vez de 'nome'
}

// Interface CustomUser (mantida para cast TS)
interface CustomUser {
  id: string;
  role: string;
  clienteId: string;
  cliente: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  aluno?: Aluno | null;
}

export default function AlunoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alunoData, setAlunoData] = useState<AlunoData | null>(null);
  const [loading, setLoading] = useState(true); // Unificado: true inicial + fetch
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("useEffect mount/trigger:", { status, hasSession: !!session }); // Log inicial (roda no client mount)

    // Early return se loading session (useSession hidrata async)
    if (status === "loading") {
      console.log("Session loading - show loading");
      setLoading(true); // Mantém loading
      return;
    }

    if (!session) {
      console.log("No session - redirect to login");
      router.push("/alunos/login");
      return;
    }

    // Cast e compute alunoId (TS safe)
    const user = session?.user as CustomUser;
    const alunoId = user?.aluno?.id;
    console.log("Session user/alunoId:", { userId: user?.id, alunoId });

    if (!alunoId) {
      console.log("No alunoId - set error state");
      setError("Usuário sem dados de aluno");
      setLoading(false);
      return;
    }

    // Fetch só se authenticated e alunoId ok
    console.log("Starting fetch for alunoId:", alunoId);
    fetchAlunoData(alunoId);
  }, [status, session?.user?.id]); // Deps: refetch se status/session muda (sem loop)

  const fetchAlunoData = async (alunoId: string) => {
    console.log("fetchAlunoData called with:", alunoId);
    setLoading(true);
    setError("");

    try {
      const url = `/api/alunos/dashboard?alunoId=${alunoId}`;
      console.log("Fetching URL:", url);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store", // Dados frescos
      });

      console.log("API Response:", {
        ok: response.ok,
        status: response.status,
      });

      if (!response.ok) {
        console.error(
          "API Error details:",
          response.status,
          response.statusText
        );
        throw new Error(`Erro ao carregar dados: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Data received (raw):", data); // Deve mostrar { nome: 'Henrique', ... } – verifique aqui!

      if (!data) {
        throw new Error("Resposta vazia da API");
      }

      // Ajuste para AlunoData (fallback nome, defaults)
      const adjustedData: AlunoData = {
        id: data.id || "",
        nome: data.nome || data.name || "Anônimo", // Fallback resolve !nome
        foto: data.foto || null,
        objetivo: data.objetivo || null,
        treinosAtivos: data.treinosAtivos || 0,
        ultimaMedida: data.ultimaMedida || null,
        avaliacoes: data.avaliacoes || 0,
        proximoTreino: data.proximoTreino || null,
      };

      console.log("Adjusted data for set:", adjustedData); // nome deve ser "Henrique"

      setAlunoData(adjustedData);
      console.log("setAlunoData called with:", adjustedData.nome);
    } catch (err: any) {
      const msg = err.message || "Erro ao carregar seus dados";
      setError(msg);
      console.error("Fetch error full:", err);
    } finally {
      setLoading(false);
      console.log(
        "fetch finally: loading=false, error=",
        !!error,
        "alunoData=",
        !!alunoData
      );
    }
  };

  console.log("Render cycle:", {
    status,
    loading,
    error,
    hasAlunoData: !!alunoData,
    dataNome: alunoData?.nome,
  });

  // Loading: Session loading OU fetch loading (unificado, sempre spinner inicial)
  if (status === "loading" || loading) {
    console.log("Rendering LOADING (session or fetch)");
    return (
      <div
        className={
          styles.loadingContainer ||
          "flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4"
        }
      >
        <div
          className={
            styles.spinner ||
            "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"
          }
        />
        <p className="mt-2 text-gray-600">Carregando seus dados...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    console.log("Rendering ERROR:", error);
    return (
      <div
        className={
          styles.errorContainer ||
          "flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center"
        }
      >
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            const user = session?.user as CustomUser;
            const id = user?.aluno?.id;
            if (id) fetchAlunoData(id);
          }}
          className={
            styles.retryButton ||
            "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          }
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Empty state (sem dados, mas session ok)
  if (!alunoData) {
    console.log("Rendering EMPTY");
    return (
      <AlunoLayout>
        <div
          className={
            styles.emptyContainer ||
            "flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center"
          }
        >
          <User
            size={64}
            className={styles.emptyIcon || "text-gray-400 mx-auto mb-4"}
          />
          <h2 className="text-2xl font-bold mb-2">Olá! Seja bem-vindo(a)</h2>
          <p className="text-gray-600 max-w-md">
            Estamos preparando seu dashboard. Em breve você verá seus treinos
            aqui.
          </p>
        </div>
      </AlunoLayout>
    );
  }

  // Full dashboard
  console.log("Rendering FULL DASHBOARD");
  return (
    <AlunoLayout>
      <div className={styles.container || "min-h-screen bg-gray-50 p-4"}>
        {/* Header */}
        <div
          className={styles.header || "bg-white rounded-lg shadow-md p-6 mb-6"}
        >
          <div className={styles.userInfo || "flex items-center"}>
            <img
              src={alunoData.foto || "/default-avatar.png"}
              alt={alunoData.nome}
              className={
                styles.avatar ||
                "w-16 h-16 rounded-full mr-4 object-cover border-2 border-gray-200"
              }
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=👤"; // Fallback online (fix 404)
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Olá, {alunoData.nome}!
              </h1>
              <p className="text-gray-600">
                Seu objetivo: {alunoData.objetivo || "Em forma! 💪"}
              </p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div
          className={
            styles.cardsGrid ||
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
          }
        >
          {/* Treinos */}
          <div
            className={
              styles.card || "bg-white rounded-lg shadow-md p-6 text-center"
            }
          >
            <Dumbbell
              size={32}
              className={styles.cardIcon || "text-blue-500 mx-auto mb-3"}
            />
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">
                Treinos Ativos
              </h3>
              <p
                className={
                  styles.cardNumber || "text-2xl font-bold text-blue-600"
                }
              >
                {alunoData.treinosAtivos || 0}
              </p>
            </div>
            <button
              className={
                styles.cardButton ||
                "mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              }
              onClick={() => router.push("/alunos/treinos")}
            >
              Ver Treinos
            </button>
          </div>

          {/* Medidas */}
          <div
            className={
              styles.card || "bg-white rounded-lg shadow-md p-6 text-center"
            }
          >
            <Ruler
              size={32}
              className={styles.cardIcon || "text-green-500 mx-auto mb-3"}
            />
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">
                Última Medida
              </h3>
              <p
                className={
                  styles.cardNumber || "text-2xl font-bold text-green-600"
                }
              >
                {alunoData.ultimaMedida?.peso || 0} kg
              </p>
            </div>
            <button
              className={
                styles.cardButton ||
                "mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              }
              onClick={() => router.push("/alunos/medidas")}
            >
              Ver Evolução
            </button>
          </div>

          {/* Avaliações */}
          <div
            className={
              styles.card || "bg-white rounded-lg shadow-md p-6 text-center"
            }
          >
            <Heart
              size={32}
              className={styles.cardIcon || "text-red-500 mx-auto mb-3"}
            />
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Avaliações</h3>
              <p
                className={
                  styles.cardNumber || "text-2xl font-bold text-red-600"
                }
              >
                {alunoData.avaliacoes || 0}
              </p>
            </div>
            <button
              className={
                styles.cardButton ||
                "mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              }
              onClick={() => router.push("/alunos/avaliacoes")}
            >
              Ver Avaliações
            </button>
          </div>

          {/* Próximo Treino */}
          <div
            className={
              styles.card || "bg-white rounded-lg shadow-md p-6 text-center"
            }
          >
            <Calendar
              size={32}
              className={styles.cardIcon || "text-purple-500 mx-auto mb-3"}
            />
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">
                Próximo Treino
              </h3>
              <p
                className={
                  styles.cardNumber || "text-2xl font-bold text-purple-600"
                }
              >
                {alunoData.proximoTreino?.data || "Sem agendamento"}
              </p>
            </div>
            <button
              className={
                styles.cardButton ||
                "mt-3 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
              }
              onClick={() => router.push("/alunos/calendario")}
            >
              Ver Cronograma
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={
            styles.footer || "bg-white rounded-lg shadow-md p-4 text-center"
          }
        >
          <p className="text-gray-600">
            💪 Continue evoluindo! Seu personal está com você.
          </p>
        </div>
      </div>
    </AlunoLayout>
  );
}

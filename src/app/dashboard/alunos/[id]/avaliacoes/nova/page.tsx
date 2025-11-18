"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Upload,
  Ruler,
  Heart,
  Dumbbell,
  Scale,
  FileText,
  AlertCircle,
} from "lucide-react";
import styles from "./styles.module.scss";

interface DobrasCutaneas {
  subescapular: number;
  triceps: number;
  peitoral: number;
  axilar: number;
  suprailiaca: number;
  abdominal: number;
  femural: number;
}

interface NovaAvaliacaoForm {
  tipo: string;
  data: string;
  // Anamnese
  historicoMedico: string;
  objetivos: string;
  praticaAnterior: string;
  fumante: boolean;
  diabetes: boolean;
  doencasArticulares: boolean;
  cirurgias: string;
  // Antropométrica
  peso: number;
  altura: number;
  imc: number;
  percentualGordura: number;
  circunferenciaCintura: number;
  circunferenciaQuadril: number;
  dobrasCutaneas: DobrasCutaneas;
  // Cardiorespiratória
  vo2Max: number;
  testeCooper: number;
  // Muscular
  forcaSupino: number;
  repeticoesFlexoes: number;
  pranchaTempo: number;
  // Flexibilidade
  testeSentarEsticar: number;
  // Observações
  resultado: string;
  observacoes: string;
  arquivo: File | null;
}

export default function NovaAvaliacaoPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const alunoId = params.id as string;
  const [form, setForm] = useState<NovaAvaliacaoForm>({
    tipo: "Inicial",
    data: new Date().toISOString().split("T")[0],
    historicoMedico: "",
    objetivos: "",
    praticaAnterior: "",
    fumante: false,
    diabetes: false,
    doencasArticulares: false,
    cirurgias: "",
    peso: 0,
    altura: 0,
    imc: 0,
    percentualGordura: 0,
    circunferenciaCintura: 0,
    circunferenciaQuadril: 0,
    dobrasCutaneas: {
      subescapular: 0,
      triceps: 0,
      peitoral: 0,
      axilar: 0,
      suprailiaca: 0,
      abdominal: 0,
      femural: 0,
    },
    vo2Max: 0,
    testeCooper: 0,
    forcaSupino: 0,
    repeticoesFlexoes: 0,
    pranchaTempo: 0,
    testeSentarEsticar: 0,
    resultado: "",
    observacoes: "",
    arquivo: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imcClassificacao, setImcClassificacao] = useState("");
  const [nomeAluno, setNomeAluno] = useState<string>("");

  useEffect(() => {
    if (!session?.user || !alunoId) {
      setError("Acesso negado ou aluno não encontrado.");
      return;
    }

    async function fetchAluno() {
      try {
        const res = await fetch(`/api/alunos/${alunoId}`);
        if (!res.ok) throw new Error("Aluno não encontrado");
        const data = await res.json();
        setNomeAluno(data.nome);
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchAluno();
  }, [session, alunoId]);

  const calcularIMC = (peso: number, altura: number) => {
    if (altura > 0) {
      const imc = peso / (((altura / 100) * altura) / 100); // Altura em cm
      const roundedImc = Math.round(imc * 100) / 100;
      setForm((prev) => ({ ...prev, imc: roundedImc }));
      if (imc < 18.5) setImcClassificacao("Baixo peso");
      else if (imc < 25) setImcClassificacao("Peso normal");
      else if (imc < 30) setImcClassificacao("Sobrepeso");
      else if (imc < 35) setImcClassificacao("Obesidade grau I");
      else if (imc < 40) setImcClassificacao("Obesidade grau II");
      else setImcClassificacao("Obesidade grau III");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name.startsWith("dobrasCutaneas.")) {
      const key = name.split(".")[1] as keyof DobrasCutaneas;
      setForm((prev) => ({
        ...prev,
        dobrasCutaneas: {
          ...prev.dobrasCutaneas,
          [key]: parseFloat(value) || 0,
        },
      }));
    } else {
      const newValue = type === "number" ? parseFloat(value) || 0 : value;
      setForm((prev) => ({ ...prev, [name]: newValue }));
    }
    // Recalcular IMC se necessário
    if (name === "peso" || name === "altura") {
      const peso = name === "peso" ? parseFloat(value) || 0 : form.peso;
      const altura = name === "altura" ? parseFloat(value) || 0 : form.altura;
      calcularIMC(peso, altura);
    }
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm((prev) => ({ ...prev, arquivo: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      setError("Usuário não autenticado.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("alunoId", alunoId);
      formData.append("tipo", form.tipo);
      formData.append("data", form.data);
      formData.append("historicoMedico", form.historicoMedico);
      formData.append("objetivos", form.objetivos);
      formData.append("praticaAnterior", form.praticaAnterior);
      formData.append("fumante", form.fumante.toString());
      formData.append("diabetes", form.diabetes.toString());
      formData.append("doencasArticulares", form.doencasArticulares.toString());
      formData.append("cirurgias", form.cirurgias);
      formData.append("peso", form.peso.toString());
      formData.append("altura", form.altura.toString());
      formData.append("imc", form.imc.toString());
      formData.append("percentualGordura", form.percentualGordura.toString());
      formData.append(
        "circunferenciaCintura",
        form.circunferenciaCintura.toString()
      );
      formData.append(
        "circunferenciaQuadril",
        form.circunferenciaQuadril.toString()
      );
      // Dobras
      Object.entries(form.dobrasCutaneas).forEach(([key, value]) => {
        formData.append(`dobrasCutaneas.${key}`, value.toString());
      });
      formData.append("vo2Max", form.vo2Max.toString());
      formData.append("testeCooper", form.testeCooper.toString());
      formData.append("forcaSupino", form.forcaSupino.toString());
      formData.append("repeticoesFlexoes", form.repeticoesFlexoes.toString());
      formData.append("pranchaTempo", form.pranchaTempo.toString());
      formData.append("testeSentarEsticar", form.testeSentarEsticar.toString());
      formData.append("resultado", form.resultado);
      formData.append("observacoes", form.observacoes);
      if (form.arquivo) formData.append("arquivo", form.arquivo);

      const res = await fetch(`/api/alunos/avaliacoes`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Erro: ${res.status}`);
      setSuccess(true);
      setTimeout(
        () => router.push(`/dashboard/alunos/${alunoId}/avaliacoes`),
        2000
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>✅</div>
          <h2>Avaliação salva com sucesso!</h2>
          <p>Redirecionando para a lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Link
            href={`/dashboard/alunos/${alunoId}/avaliacoes`}
            className={styles.backLink}
          >
            <ArrowLeft size={24} />
            Voltar às Avaliações
          </Link>
          <h1>Nova Avaliação Física</h1>
          <p>
            Preencha os dados para o aluno:{" "}
            <span className={styles.nomeDestaque}>{nomeAluno}</span>
          </p>
          {/* Substitua por nome real via API */}
        </div>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <AlertCircle size={24} className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Seção Tipo e Data */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Informações Básicas</h2>
          <div className={styles.inputGroup}>
            <label>Tipo de Avaliação</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleInputChange}
              required
            >
              <option value="Inicial">Inicial</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Mensal">Mensal</option>
              <option value="Anual">Anual</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Data</label>
            <input
              type="date"
              name="data"
              value={form.data}
              onChange={handleInputChange}
              required
            />
          </div>
        </section>

        {/* Anamnese */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Heart size={20} className={styles.icon} /> Anamnese
          </h2>
          <div className={styles.inputGroup}>
            <label>Histórico Médico</label>
            <textarea
              name="historicoMedico"
              value={form.historicoMedico}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Objetivos do Aluno</label>
            <textarea
              name="objetivos"
              value={form.objetivos}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Prática Anterior de Exercícios</label>
            <textarea
              name="praticaAnterior"
              value={form.praticaAnterior}
              onChange={handleInputChange}
              rows={2}
            />
          </div>
          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="fumante"
                checked={form.fumante}
                onChange={handleInputChange}
              />
              Fumante
            </label>
            <label>
              <input
                type="checkbox"
                name="diabetes"
                checked={form.diabetes}
                onChange={handleInputChange}
              />
              Diabético
            </label>
            <label>
              <input
                type="checkbox"
                name="doencasArticulares"
                checked={form.doencasArticulares}
                onChange={handleInputChange}
              />
              Doenças Articulares
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label>Cirurgias ou Lesões</label>
            <textarea
              name="cirurgias"
              value={form.cirurgias}
              onChange={handleInputChange}
              rows={2}
            />
          </div>
        </section>

        {/* Antropométrica */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Ruler size={20} className={styles.icon} /> Antropometria
          </h2>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>Peso (kg)</label>
              <input
                type="number"
                name="peso"
                value={form.peso}
                onChange={handleInputChange}
                step="0.1"
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Altura (cm)</label>
              <input
                type="number"
                name="altura"
                value={form.altura}
                onChange={handleInputChange}
                step="0.1"
                required
              />
            </div>
          </div>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>IMC Calculado</label>
              <input type="number" value={form.imc} readOnly />
              <small className={styles.classificacao}>{imcClassificacao}</small>
            </div>
            <div className={styles.inputGroup}>
              <label>% Gordura Corporal</label>
              <input
                type="number"
                name="percentualGordura"
                value={form.percentualGordura}
                onChange={handleInputChange}
                step="0.1"
              />
            </div>
          </div>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>Circunferência Cintura (cm)</label>
              <input
                type="number"
                name="circunferenciaCintura"
                value={form.circunferenciaCintura}
                onChange={handleInputChange}
                step="0.1"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Circunferência Quadril (cm)</label>
              <input
                type="number"
                name="circunferenciaQuadril"
                value={form.circunferenciaQuadril}
                onChange={handleInputChange}
                step="0.1"
              />
            </div>
          </div>
          <div className={styles.sectionSubTitle}>Dobras Cutâneas (mm)</div>
          <div className={styles.inputGrid}>
            {Object.entries(form.dobrasCutaneas).map(([key, value]) => (
              <div key={key} className={styles.inputGroup}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  type="number"
                  name={`dobrasCutaneas.${key}`}
                  value={value}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Cardiorespiratória */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Scale size={20} className={styles.icon} /> Cardiorespiratória
          </h2>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>VO2 Máximo (ml/kg/min)</label>
              <input
                type="number"
                name="vo2Max"
                value={form.vo2Max}
                onChange={handleInputChange}
                step="0.1"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Teste de Cooper (m)</label>
              <input
                type="number"
                name="testeCooper"
                value={form.testeCooper}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        {/* Muscular */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Dumbbell size={20} className={styles.icon} /> Força Muscular
          </h2>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>Força Supino (kg)</label>
              <input
                type="number"
                name="forcaSupino"
                value={form.forcaSupino}
                onChange={handleInputChange}
                step="0.1"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Repetições Flexões</label>
              <input
                type="number"
                name="repeticoesFlexoes"
                value={form.repeticoesFlexoes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Tempo Prancha (s)</label>
            <input
              type="number"
              name="pranchaTempo"
              value={form.pranchaTempo}
              onChange={handleInputChange}
            />
          </div>
        </section>

        {/* Flexibilidade */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <FileText size={20} className={styles.icon} /> Flexibilidade
          </h2>
          <div className={styles.inputGroup}>
            <label>Teste Sentar e Esticar (cm)</label>
            <input
              type="number"
              name="testeSentarEsticar"
              value={form.testeSentarEsticar}
              onChange={handleInputChange}
              step="0.1"
            />
          </div>
        </section>

        {/* Observações */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Observações e Resultados</h2>
          <div className={styles.inputGroup}>
            <label>Resultado Geral</label>
            <textarea
              name="resultado"
              value={form.resultado}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Observações Adicionais</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleInputChange}
              rows={6}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Arquivo PDF (Opcional)</label>
            <div className={styles.fileInput}>
              <input type="file" accept=".pdf" onChange={handleFileChange} />
              <Upload size={20} />
              {form.arquivo && <span>{form.arquivo.name}</span>}
            </div>
          </div>
        </section>

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => router.back()}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            <Save size={20} />
            {loading ? "Salvando..." : "Salvar Avaliação"}
          </button>
        </div>
      </form>
    </div>
  );
}

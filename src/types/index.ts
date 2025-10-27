// ============================================
// TYPES MODELO BASE - USUÁRIOS
// ============================================

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "USER";
  ativo: boolean;
  clienteId: string;
  createdAt: Date;
  updatedAt: Date;
  cliente?: {
    nome: string;
  };
}

export interface UsuarioFormData {
  nome: string;
  email: string;
  senha?: string;
  role: "SUPERADMIN" | "ADMIN" | "USER";
  ativo: boolean;
  clienteId: string;
}

// ============================================
// TYPES MODELO BASE - CLIENTES
// ============================================

export interface Cliente {
  id: string;
  nome: string;
  logo?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    usuarios: number;
  };
}

export interface ClienteFormData {
  nome: string;
  logo?: string;
  ativo: boolean;
}

// ============================================
// TYPES MODELO BASE - PERMISSÕES
// ============================================

export interface Permissao {
  id: string;
  usuarioId: string;
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

// ============================================
// TYPES DE ACADEMIA - ENUMS
// ============================================

export type GrupoMuscular =
  | "PEITO"
  | "COSTAS"
  | "OMBROS"
  | "BICEPS"
  | "TRICEPS"
  | "PERNAS"
  | "GLUTEOS"
  | "ABDOMEN"
  | "PANTURRILHA"
  | "ANTEBRACO"
  | "CARDIO"
  | "FUNCIONAL";

export type DiaSemana =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SABADO"
  | "DOMINGO";

// ============================================
// TYPES DE ACADEMIA - ALUNOS
// ============================================

export interface Aluno {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: Date;
  foto?: string;
  objetivo?: string;
  observacoes?: string;
  ativo: boolean;
  clienteId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlunoFormData {
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  foto?: string;
  objetivo?: string;
  observacoes?: string;
  ativo: boolean;
}

// ============================================
// TYPES DE ACADEMIA - MEDIDAS
// ============================================

export interface Medida {
  id: string;
  alunoId: string;
  peso: number;
  altura: number;
  peito?: number;
  cintura?: number;
  quadril?: number;
  bracoDireito?: number;
  bracoEsquerdo?: number;
  coxaDireita?: number;
  coxaEsquerda?: number;
  panturrilhaDireita?: number;
  panturrilhaEsquerda?: number;
  observacoes?: string;
  data: Date;
  createdAt: Date;
}

export interface MedidaFormData {
  peso: number;
  altura: number;
  peito?: number;
  cintura?: number;
  quadril?: number;
  bracoDireito?: number;
  bracoEsquerdo?: number;
  coxaDireita?: number;
  coxaEsquerda?: number;
  panturrilhaDireita?: number;
  panturrilhaEsquerda?: number;
  observacoes?: string;
}

// ============================================
// TYPES DE ACADEMIA - EXERCÍCIOS
// ============================================

export interface Exercicio {
  id: string;
  nome: string;
  grupoMuscular: GrupoMuscular;
  descricao?: string;
  video?: string;
  imagem?: string;
  equipamento?: string;
  clienteId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExercicioFormData {
  nome: string;
  grupoMuscular: GrupoMuscular;
  descricao?: string;
  video?: string;
  imagem?: string;
  equipamento?: string;
}

// ============================================
// TYPES DE ACADEMIA - TREINOS
// ============================================

export interface Treino {
  id: string;
  nome: string;
  alunoId: string;
  objetivo?: string;
  observacoes?: string;
  ativo: boolean;
  dataInicio: Date;
  dataFim?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreinoFormData {
  nome: string;
  alunoId: string;
  objetivo?: string;
  observacoes?: string;
  ativo: boolean;
  dataInicio: string;
  dataFim?: string;
}

export interface TreinoExercicio {
  id: string;
  treinoId: string;
  exercicioId: string;
  ordem: number;
  series: number;
  repeticoes: string;
  carga?: string;
  descanso?: string;
  observacoes?: string;
  createdAt: Date;
}

export interface TreinoExercicioFormData {
  exercicioId: string;
  ordem: number;
  series: number;
  repeticoes: string;
  carga?: string;
  descanso?: string;
  observacoes?: string;
}

// ============================================
// TYPES DE ACADEMIA - CRONOGRAMA
// ============================================

export interface Cronograma {
  id: string;
  treinoId: string;
  diaSemana: DiaSemana;
  horaInicio?: string;
  horaFim?: string;
  createdAt: Date;
}

export interface CronogramaFormData {
  diaSemana: DiaSemana;
  horaInicio?: string;
  horaFim?: string;
}

// ============================================
// TYPES DE ACADEMIA - EXECUÇÃO
// ============================================

export interface ExecucaoTreino {
  id: string;
  treinoId: string;
  data: Date;
  observacoes?: string;
  completo: boolean;
  createdAt: Date;
}

export interface ExecucaoExercicio {
  id: string;
  execucaoTreinoId: string;
  exercicioNome: string;
  series: number;
  repeticoes: string;
  carga?: string;
  observacoes?: string;
  createdAt: Date;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): {
  valid: boolean;
  message?: string;
} => {
  if (password.length < 6) {
    return {
      valid: false,
      message: "A senha deve ter no mínimo 6 caracteres",
    };
  }

  return { valid: true };
};

export const validateNome = (
  nome: string
): {
  valid: boolean;
  message?: string;
} => {
  if (nome.trim().length < 3) {
    return {
      valid: false,
      message: "O nome deve ter no mínimo 3 caracteres",
    };
  }

  return { valid: true };
};

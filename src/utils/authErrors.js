/**
 * Mapeia códigos de erro do Firebase Auth para mensagens amigáveis em português.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function getAuthErrorMessage(error) {
  const code = error?.code;

  switch (code) {
    case "auth/user-not-found":
      return "Usuário não encontrado";
    case "auth/wrong-password":
      return "Senha incorreta";
    case "auth/invalid-email":
      return "Email inválido";
    case "auth/invalid-credential":
      return "Email ou senha incorretos";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Erro de conexão. Verifique sua internet.";
    case "auth/email-already-in-use":
      return "Este email já está em uso";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres";
    case "auth/popup-closed-by-user":
      return "Login com Google cancelado.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.";
    case "auth/cancelled-popup-request":
      return "Login com Google cancelado.";
    case "auth/account-exists-with-different-credential":
      return "Este email já está cadastrado com outro método de login.";
    default:
      return "Não foi possível concluir a operação. Tente novamente.";
  }
}

/**
 * Mensagens amigáveis para recuperação de senha.
 *
 * @param {unknown} error
 * @returns {string}
 */
/**
 * Mensagens amigáveis para códigos de ação do Firebase Auth (verificação de e-mail).
 *
 * @param {unknown} error
 * @returns {string}
 */
export function getActionCodeErrorMessage(error) {
  const code = error?.code;

  switch (code) {
    case "auth/expired-action-code":
      return "Este link expirou. Faça login e solicite um novo e-mail de verificação.";
    case "auth/invalid-action-code":
      return "Este link é inválido ou já foi utilizado.";
    case "auth/user-disabled":
      return "Esta conta foi desativada.";
    case "auth/network-request-failed":
      return "Erro de conexão. Verifique sua internet.";
    default:
      return "Não foi possível confirmar seu e-mail. Tente novamente.";
  }
}

export function getResetPasswordErrorMessage(error) {
  const code = error?.code;

  switch (code) {
    case "functions/invalid-argument":
    case "auth/invalid-email":
      return "Email inválido";
    case "auth/network-request-failed":
    case "functions/unavailable":
    case "functions/deadline-exceeded":
      return "Falha de conexão";
    default:
      return "Não foi possível enviar o link de redefinição. Tente novamente.";
  }
}

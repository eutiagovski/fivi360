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
export function getResetPasswordErrorMessage(error) {
  const code = error?.code;

  switch (code) {
    case "auth/user-not-found":
      return "Usuário não encontrado";
    case "auth/invalid-email":
      return "Email inválido";
    case "auth/network-request-failed":
      return "Falha de conexão";
    default:
      return "Não foi possível enviar o link de redefinição. Tente novamente.";
  }
}

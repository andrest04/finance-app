export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const errorCode = error.message.split("(")[1]?.split(")")[0];

    switch (errorCode) {
      case "auth/email-already-in-use":
        return "Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.";
      case "auth/invalid-email":
        return "El correo electrónico no es válido.";
      case "auth/operation-not-allowed":
        return "El método de inicio de sesión no está habilitado.";
      case "auth/weak-password":
        return "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
      case "auth/user-disabled":
        return "Esta cuenta ha sido deshabilitada.";
      case "auth/user-not-found":
        return "No existe una cuenta con este correo electrónico.";
      case "auth/wrong-password":
        return "Contraseña incorrecta.";
      case "auth/too-many-requests":
        return "Demasiados intentos fallidos. Por favor, intenta más tarde.";
      case "auth/popup-closed-by-user":
        return "La ventana de inicio de sesión fue cerrada antes de completar la autenticación. Haz clic en el botón de Google para intentar de nuevo.";
      case "auth/popup-blocked":
        return "Tu navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio en la configuración de tu navegador y vuelve a intentar.";
      case "auth/cancelled-popup-request":
        return "Se canceló la solicitud de inicio de sesión. Si sigues teniendo problemas, intenta refrescar la página.";
      case "auth/account-exists-with-different-credential":
        return "Ya existe una cuenta con este correo electrónico usando otro método de inicio de sesión.";
      default:
        return "Ha ocurrido un error. Por favor, intenta de nuevo.";
    }
  }
  return "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.";
};

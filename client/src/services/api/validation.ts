export function validateUsername(username: string): void {
  if (!username || username.trim().length === 0) {
    throw new Error('El nombre de usuario no puede estar vacío.');
  }
  if (username.length < 3) {
    throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new Error('El nombre de usuario contiene caracteres no permitidos.');
  }
}

export function validatePassword(password: string): void {
  if (!password || password.length === 0) {
    throw new Error('La contraseña no puede estar vacía.');
  }
  if (password.length < 4) {
    throw new Error('La contraseña debe tener al menos 4 caracteres.');
  }
}

export function validateRole(role: string): void {
  const validRoles = ['ADMIN', 'STANDARD', 'VIEWER'];
  if (!validRoles.includes(role)) {
    throw new Error('El rol proporcionado no es válido.');
  }
}

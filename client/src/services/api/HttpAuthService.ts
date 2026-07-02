import type { AdminUserDTO, IAuthService, LoginResponse, UserDTO } from './interfaces.js';
import { validateUsername, validatePassword, validateRole } from './validation.js';

export class HttpAuthService implements IAuthService {
  private readonly baseUrl = '/api/auth';
  private readonly clientSignature = 'blacknails-media-handshake-key-2026';

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Blacknails-Client-Signature': this.clientSignature
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public async login(username: string, passwordRaw: string, clientId: string): Promise<LoginResponse> {
    validateUsername(username);
    validatePassword(passwordRaw);

    const headers = this.getHeaders();
    headers['X-Client-Id'] = clientId;

    const res = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password: passwordRaw, clientId })
    });

    if (!res.ok) {
      let errorMessage = 'Error al iniciar sesión.';
      try {
        const err = await res.json();
        if (err.error) errorMessage = err.error;
      } catch (e) {
        if (res.status === 502 || res.status === 503) {
          errorMessage = 'Servidor no disponible (Error 502/503). Verifique su conectividad.';
        }
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return data;
  }

  public async register(username: string, passwordRaw: string, role: 'ADMIN' | 'STANDARD' | 'VIEWER'): Promise<UserDTO> {
    validateUsername(username);
    validatePassword(passwordRaw);
    validateRole(role);

    const res = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, password: passwordRaw, role })
    });

    if (!res.ok) {
      let errorMessage = 'Error al registrar el usuario.';
      try {
        const err = await res.json();
        if (err.error) errorMessage = err.error;
      } catch (e) {
        if (res.status === 502 || res.status === 503) {
          errorMessage = 'Servidor no disponible (Error 502/503). Verifique su conectividad.';
        }
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  public async getProfile(token: string): Promise<UserDTO> {
    if (!token) {
      throw new Error('No se proporcionó un token de sesión.');
    }

    const res = await fetch(`${this.baseUrl}/me`, {
      method: 'GET',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      let errorMessage = 'Error al obtener el perfil del usuario.';
      try {
        const err = await res.json();
        if (err.error) errorMessage = err.error;
      } catch (e) {
        if (res.status === 502 || res.status === 503) {
          errorMessage = 'Servidor no disponible (Error 502/503). Verifique su conectividad.';
        }
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  public async listUsers(token: string): Promise<AdminUserDTO[]> {
    const res = await fetch('/api/admin/users', {
      method: 'GET',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      let errorMessage = 'Error al obtener los usuarios.';
      try {
        const err = await res.json();
        if (err.error) errorMessage = err.error;
      } catch (e) {
        if (res.status === 502 || res.status === 503) {
          errorMessage = 'Servidor no disponible (Error 502/503). Verifique su conectividad.';
        }
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  public async updateUserRole(
    token: string,
    userId: string,
    role: 'ADMIN' | 'STANDARD' | 'VIEWER'
  ): Promise<AdminUserDTO> {
    validateRole(role);

    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ role })
    });

    if (!res.ok) {
      let errorMessage = 'Error al actualizar el rol del usuario.';
      try {
        const err = await res.json();
        if (err.error) errorMessage = err.error;
      } catch (e) {
        if (res.status === 502 || res.status === 503) {
          errorMessage = 'Servidor no disponible (Error 502/503). Verifique su conectividad.';
        }
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  public async updateUserActive(token: string, userId: string, isActive: boolean): Promise<AdminUserDTO> {
    const res = await fetch(`/api/admin/users/${userId}/active`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ isActive })
    });

    if (!res.ok) {
      let errorMessage = 'Error al actualizar el estado del usuario.';
      try {
        const err = await res.json();
        if (err.error) errorMessage = err.error;
      } catch (e) {
        if (res.status === 502 || res.status === 503) {
          errorMessage = 'Servidor no disponible (Error 502/503). Verifique su conectividad.';
        }
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  public async deleteUser(token: string, userId: string): Promise<void> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      let errorMessage = 'Error al eliminar el usuario.';
      try {
        const err = await res.json();
        if (err.error) errorMessage = err.error;
      } catch (e) {
        if (res.status === 502 || res.status === 503) {
          errorMessage = 'Servidor no disponible (Error 502/503). Verifique su conectividad.';
        }
      }
      throw new Error(errorMessage);
    }
  }
}

export interface LoginRequest {
  username: string;
  passwordRaw: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  isActive: boolean;
  expiresAt: string;
  userId: string;
}

export interface ILoginUseCase {
  execute(request: LoginRequest): Promise<LoginResponse>;
}

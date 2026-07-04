import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../../context/AuthContext.js';

export function useLoginLogic() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const clearError = () => setErrorMessage('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      setErrorMessage('Introduce usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await login(username, password, rememberMe);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Credenciales incorrectas.');
      setIsLoading(false);
    }
  };

  return {
    username,
    password,
    rememberMe,
    showPassword,
    isLoading,
    errorMessage,
    hasError: Boolean(errorMessage),
    setUsername,
    setPassword,
    setRememberMe,
    togglePasswordVisibility: () => setShowPassword((current) => !current),
    clearError,
    handleSubmit
  };
}

export type LoginLogic = ReturnType<typeof useLoginLogic>;

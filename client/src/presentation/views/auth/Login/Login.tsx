import { LoginView } from './LoginView.js';
import { useLoginLogic } from './useLoginLogic.js';

export function Login() {
  const logic = useLoginLogic();
  return <LoginView logic={logic} />;
}

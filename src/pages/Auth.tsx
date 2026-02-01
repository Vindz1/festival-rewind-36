import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4 bg-card p-8 rounded-xl border">
        <h1 className="text-2xl font-bold text-center">Connexion SetlistMemory</h1>
        <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full">Se connecter</Button>
      </form>
    </div>
  );
};

export default Auth;

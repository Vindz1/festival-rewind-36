import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flame, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSpotify } from '@/hooks/useSpotify';
import { toast } from 'sonner';

const SpotifyCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeCode } = useSpotify();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      toast.error('Connexion Spotify annulée');
      setTimeout(() => navigate('/festivals'), 2000);
      return;
    }

    if (code) {
      exchangeCode(code)
        .then(() => {
          setStatus('success');
          toast.success('Spotify connecté avec succès !');
          setTimeout(() => navigate('/festivals'), 2000);
        })
        .catch(() => {
          setStatus('error');
          toast.error('Erreur de connexion Spotify');
          setTimeout(() => navigate('/festivals'), 2000);
        });
    }
  }, [searchParams, exchangeCode, navigate]);

  return (
    <div className="min-h-screen bg-background noise flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-dark" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={status === 'loading' ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: status === 'loading' ? Infinity : 0, ease: 'linear' }}
          className="inline-block mb-6"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-gradient-fire'
          }`}>
            {status === 'loading' && <Flame className="w-10 h-10 text-white" />}
            {status === 'success' && <Check className="w-10 h-10 text-white" />}
            {status === 'error' && <X className="w-10 h-10 text-white" />}
          </div>
        </motion.div>
        
        <h1 className="font-display text-3xl text-foreground mb-2">
          {status === 'loading' && 'Connexion à Spotify...'}
          {status === 'success' && 'Connecté !'}
          {status === 'error' && 'Erreur de connexion'}
        </h1>
        <p className="text-muted-foreground">
          {status === 'loading' && 'Veuillez patienter...'}
          {status === 'success' && 'Redirection en cours...'}
          {status === 'error' && 'Redirection en cours...'}
        </p>
      </motion.div>
    </div>
  );
};

export default SpotifyCallback;

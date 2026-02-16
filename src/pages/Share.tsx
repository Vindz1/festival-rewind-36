import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  MessageCircle,
  Mail,
  Link2,
  Check,
  Copy,
  QrCode,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Share() {
  const [copied, setCopied] = useState(false);

  const siteUrl = 'https://setlive.fr';
  const shareText = '🎸 Transformez vos concerts en playlists universelles ! Hellfest 2026, Download Festival et tous vos souvenirs de concerts → ';
  const hashtags = 'Setlive,Concerts,Playlists,Hellfest2026';

  const socialLinks = [
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}&hashtags=${hashtags}`,
      description: 'Partager sur X (Twitter)'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2] hover:bg-[#1664D8]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`,
      description: 'Partager sur Facebook'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0A66C2] hover:bg-[#004182]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`,
      description: 'Partager sur LinkedIn'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366] hover:bg-[#1DA851]',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + siteUrl)}`,
      description: 'Partager sur WhatsApp'
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-[#4d94ff] hover:bg-[#3d84ef]',
      url: `mailto:?subject=${encodeURIComponent('Découvre Setlive 🎸')}&body=${encodeURIComponent(shareText + '\n\n' + siteUrl)}`,
      description: 'Partager par email'
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 pb-20">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#4d94ff] to-purple-500 mb-6 animate-pulse-slow">
            <Share2 className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase mb-4 tracking-tighter">
            PARTAGEZ<span className="text-[#4d94ff]"> SETLIVE</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Aidez vos amis métalleux à transformer leurs concerts en playlists ! 
            Plus on est nombreux, plus la base de données s'enrichit.
          </p>
        </div>

        {/* Copier le lien */}
        <div className="mb-12 p-6 bg-[#252525] border border-[#333] rounded-2xl">
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Lien direct
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={siteUrl}
              readOnly
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#4d94ff]"
            />
            <Button
              onClick={handleCopyLink}
              className={`px-6 transition-all ${
                copied 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-[#4d94ff] hover:bg-[#6ba6ff]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copier
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="mb-12">
          <h2 className="text-2xl font-black italic uppercase mb-6 text-center">
            Partager sur les réseaux
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialLinks.map((social, index) => (
              <button
                key={index}
                onClick={() => handleShare(social.url)}
                className={`group relative p-6 rounded-xl border border-[#333] hover:border-[#4d94ff] transition-all ${social.color} bg-opacity-10 hover:bg-opacity-20`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${social.color}`}>
                    <social.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-white mb-1">{social.name}</h3>
                    <p className="text-xs text-gray-400">{social.description}</p>
                  </div>
                  <Share2 className="w-5 h-5 text-gray-400 group-hover:text-[#4d94ff] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code (optionnel - à générer) */}
        <div className="mb-12 p-8 bg-gradient-to-br from-[#252525] to-[#1a1a1a] border border-[#333] rounded-2xl text-center">
          <QrCode className="w-16 h-16 mx-auto mb-4 text-[#4d94ff]" />
          <h2 className="text-2xl font-black italic uppercase mb-3">
            QR CODE
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Scannez ce QR code pour accéder instantanément au site depuis votre smartphone
          </p>
          <div className="inline-block p-6 bg-white rounded-xl">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}`}
              alt="QR Code Setlive"
              className="w-48 h-48"
            />
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Parfait pour partager en concert ou festival !
          </p>
        </div>

        {/* Statistiques d'impact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div className="p-6 bg-[#252525] border border-[#333] rounded-xl text-center">
            <p className="text-3xl font-black text-[#4d94ff] mb-2">1M+</p>
            <p className="text-sm text-gray-400">Setlists disponibles</p>
          </div>
          <div className="p-6 bg-[#252525] border border-[#333] rounded-xl text-center">
            <p className="text-3xl font-black text-green-500 mb-2">100%</p>
            <p className="text-sm text-gray-400">Gratuit</p>
          </div>
          <div className="p-6 bg-[#252525] border border-[#333] rounded-xl text-center">
            <p className="text-3xl font-black text-purple-500 mb-2">3</p>
            <p className="text-sm text-gray-400">Plateformes</p>
          </div>
          <div className="p-6 bg-[#252525] border border-[#333] rounded-xl text-center">
            <p className="text-3xl font-black text-yellow-500 mb-2">2 clics</p>
            <p className="text-sm text-gray-400">Pour exporter</p>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center p-8 bg-gradient-to-r from-[#4d94ff]/10 to-purple-500/10 border border-[#4d94ff]/30 rounded-2xl">
          <h2 className="text-2xl font-black italic uppercase mb-3">
            Merci de faire connaître Setlive ! 🤘
          </h2>
          <p className="text-gray-400 mb-6">
            Chaque partage aide à maintenir le service gratuit et à développer de nouvelles fonctionnalités.
          </p>
          <Button
            onClick={() => handleShare(socialLinks[0].url)}
            className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-blue-500/20"
          >
            <Twitter className="w-5 h-5 mr-2" />
            Partager maintenant
          </Button>
        </div>

      </div>

      <Footer />
    </div>
  );
}

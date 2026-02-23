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
  Check,
  Copy,
  QrCode,
  Download,
  Code,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Share() {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const siteUrl = 'https://setlive.fr';
  const shareText = 'Transformez vos concerts passés et festivals 2026 en playlists universelles ! 🎸';
  const hashtags = 'Setlive,Concerts,Playlists,Festivals';

  const widgetCode = `<a href="https://setlive.fr" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:10px;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-family:sans-serif;font-weight:bold;border:1px solid #4d94ff;"><img src="https://setlive.fr/favicon.svg" alt="Setlive Logo" style="width:24px;height:24px;" /> Générez votre playlist du festival avec Setlive !</a>`;

  const socialLinks = [
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      url: 'https://instagram.com',
      description: 'Partager en Story',
      isInstagram: true
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}&hashtags=${hashtags}`,
      description: 'Partager sur X'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2] hover:bg-[#1664D8]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`,
      description: 'Partager sur Facebook'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366] hover:bg-[#1DA851]',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + siteUrl)}`,
      description: 'Envoyer à un ami'
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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(widgetCode);
      setCopiedCode(true);
      toast.success('Code HTML copié !');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie du code');
    }
  };

  const handleShare = async (social: any) => {
    // Astuce spéciale pour Instagram
    if (social.isInstagram) {
      try {
        await navigator.clipboard.writeText(siteUrl);
        toast.success('Lien copié ! Ouvrez Instagram et collez-le dans votre Story.');
        setTimeout(() => window.open(social.url, '_blank'), 1500);
      } catch (err) {
        window.open(social.url, '_blank');
      }
      return;
    }
    // Pour les autres réseaux
    window.open(social.url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 pb-20">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Remplacement de l'icône par le Favicon SVG */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#1a1a1a] border border-[#4d94ff]/30 mb-6 shadow-[0_0_30px_rgba(77,148,255,0.2)] p-4">
            <img src="/favicon.svg" alt="Setlive Logo" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase mb-4 tracking-tighter">
            PARTAGEZ<span className="text-[#4d94ff]"> SETLIVE</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Aidez vos amis à transformer leurs concerts en playlists ! 
            Plus on est nombreux, plus la base de données s'enrichit.
          </p>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1 : POUR LES FANS */}
        {/* ========================================================= */}

        {/* Aperçu de l'encart avec le Favicon */}
        <div className="mb-12 p-6 bg-[#252525] border border-[#333] rounded-2xl shadow-md">
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
            Aperçu de votre partage
          </label>
          <div className="bg-[#1a1a1a] border border-[#404040] rounded-xl overflow-hidden flex flex-col sm:flex-row">
            <div className="w-full sm:w-1/3 bg-[#252525] p-8 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-[#404040]">
               <img src="/favicon.svg" alt="Setlive Logo" className="w-24 h-24 drop-shadow-xl" />
            </div>
            <div className="p-6 flex flex-col justify-center w-full sm:w-2/3">
              <h3 className="font-bold text-white mb-2 text-lg lg:text-xl">Setlive - Vos Concerts en Playlists</h3>
              <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                Transformez vos concerts passés et les programmations des festivals 2026 en playlists Spotify, Deezer, Qobuz, Apple Music, ou autres.
              </p>
              <p className="text-xs text-[#4d94ff] font-mono font-bold uppercase tracking-wider">setlive.fr</p>
            </div>
          </div>
        </div>

        {/* Copier le lien */}
        <div className="mb-12 p-6 bg-[#252525] border border-[#333] rounded-2xl shadow-md">
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Lien direct
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={siteUrl}
              readOnly
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#4d94ff]"
            />
            <Button
              onClick={handleCopyLink}
              className={`px-6 py-6 sm:py-3 transition-all font-bold ${
                copied 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-[#4d94ff] hover:bg-[#6ba6ff]'
              }`}
            >
              {copied ? (
                <><Check className="w-5 h-5 mr-2" /> Copié !</>
              ) : (
                <><Copy className="w-5 h-5 mr-2" /> Copier le lien</>
              )}
            </Button>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="mb-16">
          <h2 className="text-2xl font-black italic uppercase mb-6 text-center">
            Partager sur les réseaux
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {socialLinks.map((social, index) => (
              <button
                key={index}
                onClick={() => handleShare(social)}
                className={`group relative p-6 rounded-xl border border-[#333] hover:border-[#4d94ff] transition-all bg-[#252525] hover:bg-[#2a2a2a] flex flex-col items-center text-center`}
              >
                <div className={`p-4 rounded-full ${social.color} transition-transform group-hover:scale-110 mb-4 shadow-lg`}>
                  <social.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-1 group-hover:text-[#4d94ff] transition-colors">{social.name}</h3>
                <p className="text-xs text-gray-400">{social.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div className="mb-20 p-8 bg-gradient-to-br from-[#252525] to-[#1a1a1a] border border-[#333] rounded-2xl text-center shadow-lg">
          <QrCode className="w-12 h-12 mx-auto mb-4 text-[#4d94ff]" />
          <h2 className="text-2xl font-black italic uppercase mb-3">
            QR CODE RAPIDE
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Scannez ce QR code pour accéder instantanément au site. Parfait pour partager dans la file d'attente d'un concert !
          </p>
          <div className="inline-block p-4 bg-white rounded-xl shadow-inner">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(siteUrl)}`}
              alt="QR Code Setlive"
              className="w-32 h-32"
            />
          </div>
        </div>


        {/* ========================================================= */}
        {/* SECTION 2 : POUR LES FESTIVALS / B2B */}
        {/* ========================================================= */}
        
        <div className="relative p-1 rounded-3xl bg-gradient-to-br from-[#4d94ff] via-purple-500 to-[#1a1a1a] mb-12">
          <div className="bg-[#1a1a1a] rounded-[22px] p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Megaphone className="w-6 h-6 text-[#4d94ff]" />
                  <h2 className="text-2xl font-black italic uppercase tracking-wider">Espace Partenaires & Festivals</h2>
                </div>
                <p className="text-gray-400 text-sm">Vous organisez un festival ? Prolongez l'expérience de vos festivaliers en intégrant Setlive à votre communication.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Option 1 : Le bouton HTML */}
              <div className="bg-[#252525] p-6 rounded-xl border border-[#333]">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#4d94ff]" /> 1. Le Bouton Web
                </h3>
                <p className="text-xs text-gray-400 mb-4">Intégrez ce code HTML sur la page programmation de votre site web.</p>
                
                {/* Preview visuelle du bouton */}
                <div className="mb-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#404040] flex justify-center">
                  <div dangerouslySetInnerHTML={{ __html: widgetCode }} />
                </div>

                {/* Code à copier */}
                <div className="relative group">
                  <textarea 
                    readOnly 
                    value={widgetCode}
                    className="w-full h-24 bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 text-xs font-mono text-gray-300 resize-none focus:outline-none"
                  />
                  <Button 
                    onClick={handleCopyCode}
                    size="sm"
                    className="absolute top-2 right-2 bg-[#333] hover:bg-[#4d94ff] text-white text-xs h-7"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : 'Copier'}
                  </Button>
                </div>
              </div>

              {/* Option 2 : Le Kit et Contact */}
              <div className="flex flex-col gap-4">
                <div className="bg-[#252525] p-6 rounded-xl border border-[#333] flex-1">
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#4d94ff]" /> 2. Kit Médias & Réseaux
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">Téléchargez nos logos, encarts pour vos newsletters et visuels pour stories Instagram.</p>
                  <Button variant="outline" className="w-full border-[#404040] hover:bg-[#333] text-gray-300" onClick={() => toast.info('Kit Média en préparation !')}>
                    Télécharger le Kit Média (.zip)
                  </Button>
                </div>

                <div className="bg-[#252525] p-6 rounded-xl border border-[#333] flex-1">
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#4d94ff]" /> 3. Devenir Festival Pépite
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">Vous souhaitez être mis en avant sur notre carte interactive ? Écrivez-nous !</p>
                  <Button className="w-full bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold" onClick={() => window.location.href = "mailto:setlive@proton.me?subject=Partenariat Setlive"}>
                    setlive@proton.me
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

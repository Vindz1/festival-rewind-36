import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { UniversalSearch } from "@/components/UniversalSearch";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    // On vérifie si l'URL contient un code de Spotify
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      handleSpotifyCallback(code);
    }
  }, []);

  const handleSpotifyCallback = async (code: string) => {
    setIsProcessing(true);
    const songs = JSON.parse(localStorage.getItem("pending_songs") || "[]");
    
    try {
      setStatus("Connexion Spotify...");
      const res = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "token", code })
      });
      const { access_token } = await res.json();

      setStatus("Recherche des titres...");
      const uris = [];
      for (const s of songs.slice(0, 15)) {
        const sRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(s.title)}%20artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const sData = await sRes.json();
        if (sData.tracks?.items?.[0]) uris.push(sData.tracks.items[0].uri);
      }

      setStatus("Création de la playlist...");
      const cRes = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "create", 
          accessToken: access_token, 
          playlistName: "Ma Time Capsule Live", 
          uris 
        })
      });
      const cData = await cRes.json();
      setPlaylistUrl(cData.url);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la création.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 px-4 pb-20">
        {isProcessing ? (
          <div className="max-w-md mx-auto mt-20 text-center space-y-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">{status}</h2>
          </div>
        ) : playlistUrl ? (
          <div className="max-w-md mx-auto mt-20 text-center bg-zinc-900 p-10 rounded-3xl border border-primary/20">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 italic">C'est prêt !</h2>
            <Button variant="fire" className="w-full h-14" onClick={() => window.open(playlistUrl, "_blank")}>
              Ouvrir Spotify
            </Button>
            <Button variant="link" className="mt-4 text-zinc-500" onClick={() => window.location.href = "/"}>
              Créer une autre playlist
            </Button>
          </div>
        ) : (
          <>
            <Hero />
            <div className="mt-12">
              <UniversalSearch />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;

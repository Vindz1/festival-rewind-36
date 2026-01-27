import { Header } from "@/components/Header";
import { UniversalSearch } from "@/components/UniversalSearch";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-32 pb-20 px-4 flex flex-col items-center">
        <div className="w-full max-w-2xl text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase text-white">
            Festival <span className="text-primary">Rewind</span>
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl max-w-lg mx-auto">
            Transforme tes souvenirs Setlist.fm en playlists Spotify.
          </p>
          <UniversalSearch />
        </div>
      </main>
    </div>
  );
};

export default Index;

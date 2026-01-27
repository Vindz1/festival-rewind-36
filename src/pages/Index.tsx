import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { UniversalSearch } from "@/components/UniversalSearch";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-24 pb-20">
        <Hero />
        <div className="mt-12 px-4">
          <UniversalSearch />
        </div>
      </main>
    </div>
  );
};

export default Index;

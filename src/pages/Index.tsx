import ThreeEarth from '@/components/ThreeEarth';
import earthHero from '@/assets/earth-hero.jpg';

const Index = () => {
  return (
    <main className="relative">
      {/* SEO Meta Tags - handled by index.html */}
      <h1 className="sr-only">Earth Weather Prediction - Interactive Global Climate Visualization</h1>
      
      {/* Hero Section with 3D Earth */}
      <section className="relative min-h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${earthHero})` }}
          aria-hidden="true"
        />
        <ThreeEarth />
      </section>
    </main>
  );
};

export default Index;

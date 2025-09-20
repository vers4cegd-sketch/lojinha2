import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-black py-20 text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
          MAIOR LOJA DE JOGOS DA AMÉRICA LATINA
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 font-medium">
          Contas premium verificadas com garantia total e suporte 24/7
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
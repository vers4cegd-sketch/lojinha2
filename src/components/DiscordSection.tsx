import React from 'react';
import { MessageCircle } from 'lucide-react';

const DiscordSection: React.FC = () => {
  return (
    <section className="bg-black py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <MessageCircle className="w-16 h-16 mx-auto mb-6 text-white" />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          CONHEÇA NOSSO DISCORD COM PROMOÇÕES IMPERDÍVEIS
        </h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          Junte-se à nossa comunidade e tenha acesso a ofertas exclusivas, sorteios e suporte prioritário
        </p>
        <button className="bg-black border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105">
          ENTRAR NO DISCORD
        </button>
      </div>
    </section>
  );
};

export default DiscordSection;
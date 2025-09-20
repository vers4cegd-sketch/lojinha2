import React from 'react';
import { Shield, User, Star } from 'lucide-react';

const Footer: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: '100% Seguro',
      description: 'Transações protegidas e contas verificadas',
    },
    {
      icon: User,
      title: 'Suporte 24/7',
      description: 'Atendimento especializado sempre disponível',
    },
    {
      icon: Star,
      title: 'Qualidade Premium',
      description: 'Contas de alta qualidade com garantia',
    },
  ];

  return (
    <footer className="bg-black border-t border-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <feature.icon className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Traking.shop. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
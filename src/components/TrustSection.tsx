import React from 'react';
import { Users, Star, ShoppingBag } from 'lucide-react';

const TrustSection: React.FC = () => {
  const stats = [
    { icon: Users, value: '+3 MIL', label: 'clientes' },
    { icon: Star, value: '4.9', label: 'de avaliação' },
    { icon: ShoppingBag, value: '+4.119', label: 'contas vendidas' },
  ];

  return (
    <section className="bg-black py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-8 text-center transform transition-all duration-300 hover:scale-105 hover:bg-gray-700"
            >
              <stat.icon className="w-12 h-12 mx-auto mb-4 text-white" />
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-300 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
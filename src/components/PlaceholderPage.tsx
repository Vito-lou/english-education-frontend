import React from 'react';
import { Card } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
  features?: string[];
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon,
  features = []
}) => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>

        <Card className="p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}功能</h3>
            <p className="text-gray-500 mb-6">
              {description}
            </p>

            {features.length > 0 && (
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">主要功能包括：</h4>
                <ul className="text-sm text-gray-500 space-y-1">
                  {features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlaceholderPage;

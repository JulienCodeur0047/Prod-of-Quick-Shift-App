import React from 'react';
import { Check } from 'lucide-react';
import { Plan } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface PricingProps {
  onSelectPlan: (plan: Plan) => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  const planKeys: Plan[] = ['Gratuit', 'Pro', 'Pro Plus'];
  
  const planDetails: { [key in Plan]: { key: string, isFeatured: boolean, featureCount: number } } = {
    'Gratuit': { key: 'freePlan', isFeatured: false, featureCount: 3 },
    'Pro': { key: 'proPlan', isFeatured: true, featureCount: 5 },
    'Pro Plus': { key: 'proPlusPlan', isFeatured: false, featureCount: 7 },
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {planKeys.map((planName) => {
        const plan = planDetails[planName];
        const features = Array.from({ length: plan.featureCount }, (_, i) => t(`pricing.${plan.key}Feature${i + 1}`));
        const price = Number(t(`pricing.${plan.key}Price`));

        return (
          <div
            key={plan.key}
            className={`rounded-xl p-8 border transition-transform duration-300 flex flex-col ${
              plan.isFeatured 
                ? 'bg-blue-night-900 text-white border-blue-700 dark:border-blue-night-700 scale-105 shadow-2xl' 
                : 'bg-white dark:bg-blue-night-900 border-gray-200 dark:border-blue-night-800 hover:scale-105'
            }`}
          >
            <div className="flex-grow">
              <h3 className="text-2xl font-bold">{t(`pricing.${plan.key}Name`)}</h3>
              <p className={`mt-2 ${plan.isFeatured ? 'text-blue-night-300' : 'text-gray-500 dark:text-gray-400'}`}>{t(`pricing.${plan.key}Desc`)}</p>
              <p className="mt-6 text-5xl font-extrabold">
                {formatCurrency(price)}
                <span className="text-lg font-medium">{t('pricing.perMonth')}</span>
              </p>
              <ul className="mt-8 space-y-4">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${plan.isFeatured ? 'text-blue-400 dark:text-blue-night-300' : 'text-blue-600 dark:text-blue-night-400'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan(planName)}
              className={`w-full mt-8 py-3 px-6 rounded-lg font-semibold transition-colors duration-300 ${
                plan.isFeatured
                  ? 'bg-white text-blue-600 hover:bg-gray-200 dark:text-blue-night-900 dark:hover:bg-blue-night-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-night-200 dark:text-blue-night-900 dark:hover:bg-blue-night-300'
              }`}
            >
              {t('pricing.choosePlan')}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Pricing;
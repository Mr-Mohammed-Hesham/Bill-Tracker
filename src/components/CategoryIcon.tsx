import React from 'react';
import {
  Utensils,
  Zap,
  Home,
  Car,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Coffee,
  Layers,
} from 'lucide-react';
import { getCategoryMeta, type ExpenseCategory } from '../types/finance';

interface CategoryIconProps {
  category: ExpenseCategory;
  size?: 'sm' | 'md';
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 'md' }) => {
  const meta = getCategoryMeta(category);

  const Icon =
    category === 'food'
      ? Utensils
      : category === 'utilities'
        ? Zap
        : category === 'housing'
          ? Home
          : category === 'transport'
            ? Car
            : category === 'health'
              ? HeartPulse
              : category === 'shopping'
                ? ShoppingBag
                : category === 'family'
                  ? GraduationCap
                  : category === 'entertainment'
                    ? Coffee
                    : Layers;

  const boxClass = size === 'sm' ? 'w-8 h-8 rounded-xl' : 'w-10 h-10 rounded-xl';
  const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`${boxClass} ${meta.bgClass} ${meta.textClass} flex items-center justify-center shrink-0`}
    >
      <Icon className={iconClass} />
    </div>
  );
};

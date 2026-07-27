import { containersIndustry } from './containers';
import type { IndustryConfig } from './types';

const industries: Record<string, IndustryConfig> = {
  containers: containersIndustry,
};

const activeId = process.env.EXPO_PUBLIC_INDUSTRY ?? 'containers';

export const industry: IndustryConfig = industries[activeId] ?? containersIndustry;

export function useIndustry(): IndustryConfig {
  return industry;
}

export function label(
  key: keyof IndustryConfig['labels'],
  form: 'singular' | 'plural' | 'value' = 'value',
): string {
  const value = industry.labels[key];
  if (typeof value === 'string') return value;
  return form === 'plural' ? value.plural : value.singular;
}

export type { IndustryConfig, StatusOption, FormFieldConfig } from './types';

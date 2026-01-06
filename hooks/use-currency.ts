import { useQuery } from '@tanstack/react-query';
import { formatCurrency as formatCurrencyUtil, type CurrencyCode } from '@/lib/currency';

export function useCurrency() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const currency = (profile?.preferredCurrency || 'USD') as CurrencyCode;

  const formatCurrency = (amount: number, overrideCurrency?: CurrencyCode) => {
    return formatCurrencyUtil(amount, overrideCurrency || currency);
  };

  return {
    currency,
    formatCurrency,
  };
}

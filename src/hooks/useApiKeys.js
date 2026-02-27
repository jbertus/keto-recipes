
import { useApiKeysContext } from '@/contexts/ApiKeysContext';

export default function useApiKeys() {
  const context = useApiKeysContext();
  if (!context) {
    throw new Error('useApiKeys must be used within an ApiKeysProvider');
  }
  return context;
}

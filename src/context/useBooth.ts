import { useContext } from 'react';
import { BoothContext } from './boothContextValue';
import type { BoothContextType } from './boothContextValue';

export const useBooth = (): BoothContextType => {
  const context = useContext(BoothContext);
  if (!context) {
    throw new Error('useBooth must be used within a BoothProvider');
  }
  return context;
};

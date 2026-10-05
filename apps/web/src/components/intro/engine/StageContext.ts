import { createContext } from 'react';
import type { StageContextValue } from './types';

export const StageContext = createContext<StageContextValue | null>(null);

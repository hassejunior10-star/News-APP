import type { CSSProperties } from 'react';

/** Quadriculado que indica fundo transparente. */
export const CHECKER_STYLE: CSSProperties = {
  backgroundColor: '#30303a',
  backgroundImage:
    'linear-gradient(45deg,#3f3f4c 25%,transparent 25%,transparent 75%,#3f3f4c 75%),' +
    'linear-gradient(45deg,#3f3f4c 25%,transparent 25%,transparent 75%,#3f3f4c 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 10px 10px',
};

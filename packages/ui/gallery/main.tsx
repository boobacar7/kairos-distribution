import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '../src/styles.css';
import { Gallery } from './Gallery.js';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Gallery root element is missing');
}

createRoot(root).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);

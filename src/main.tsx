import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force cache clear - updated timestamp
console.log('Admin App Loading - v2.0.0');

createRoot(document.getElementById("root")!).render(<App />);

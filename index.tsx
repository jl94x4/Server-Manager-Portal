import { createRoot } from 'react-dom/client';
import { MainApp } from './client/App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<MainApp />);

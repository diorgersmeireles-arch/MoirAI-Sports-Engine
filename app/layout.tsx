import type { Metadata } from 'next';
import './globals.css';
import NavBar from './nav';

export const metadata: Metadata = {
  title: 'MoirAI Sports Engine',
  description: 'Plataforma de análise estatística esportiva de alta precisão',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

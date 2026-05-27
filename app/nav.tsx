'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/matches', label: 'Partidas' },
  { href: '/players', label: 'Atletas' },
  { href: '/compare', label: 'Comparar' },
  { href: '/scanner', label: 'Scanner' },
  { href: '/competitions', label: 'Competições' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-sport-surface border-b border-sport-border">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="text-sport-gold font-bold text-lg tracking-wider">
          ⚡ MoirAI
        </Link>
        <div className="flex gap-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  active
                    ? 'bg-sport-accent/20 text-sport-accent'
                    : 'text-sport-dim hover:text-sport-text hover:bg-sport-border/50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

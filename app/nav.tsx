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
  { href: '/legends', label: '🏆 Lendas' },
  { href: '/dream-team', label: '⭐ Dream Team' },
  { href: '/roadmap', label: '🚀 Roadmap' },
  { href: '/import', label: '📥 Importar' },
  { href: '/admin', label: '⚙️ Admin' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-b from-black via-[#0a0a0a] to-black border-b border-[#d4af37]/10">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="group flex items-center gap-2">
          <span className="text-[#d4af37] font-bold text-lg tracking-[0.15em] uppercase">
            ⚡ <span className="group-hover:text-[#f0d060] transition-colors">MoirAI</span>
          </span>
          <span className="hidden sm:inline text-[10px] text-[#d4af37]/40 tracking-[0.3em] uppercase">Sports Engine</span>
        </Link>
        <div className="flex gap-0.5 overflow-x-auto">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#d4af37]/10 text-[#d4af37] shadow-gold-sm'
                    : 'text-[#888] hover:text-[#d4af37]/70 hover:bg-[#d4af37]/5'
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

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Palette, Check } from 'lucide-react';

interface BackgroundSelectorProps {
  currentBackground: string;
  onSelect: (bg: string) => void;
}

const SOLID_COLORS = [
  { id: 'bg-indigo-600', name: 'Indigo' },
  { id: 'bg-emerald-700', name: 'Emerald' },
  { id: 'bg-rose-700', name: 'Rose' },
  { id: 'bg-zinc-900', name: 'Dark Zinc' },
];

const GRADIENTS = [
  { id: 'from-esperia-purple to-esperia-pink', name: 'Esperia Mesh' },
  { id: 'from-blue-600 to-violet-600', name: 'Ocean Twilight' },
  { id: 'from-fuchsia-600 to-pink-600', name: 'Fuchsia Sunrise' },
  { id: 'from-emerald-500 to-teal-700', name: 'Forest Mint' },
];

const IMAGES = [
  { id: 'url(https://images.unsplash.com/photo-1506744626753-1fa28f673b0c?q=80&w=2560&auto=format&fit=crop)', name: 'Mountains' },
  { id: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2560&auto=format&fit=crop)', name: 'Space' },
  { id: 'url(https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2560&auto=format&fit=crop)', name: 'Hills' },
  { id: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop)', name: 'Beach' },
];

export default function BackgroundSelector({ currentBackground, onSelect }: BackgroundSelectorProps) {
  const isSelected = (id: string) => currentBackground === id || currentBackground.includes(id);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 hover:bg-white/60 dark:hover:bg-zinc-900/60 backdrop-blur-md font-bold transition-all text-xs cursor-pointer shadow-xs">
          <Palette className="w-4 h-4 text-primary" />
          Customize
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          sideOffset={8}
          align="end"
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin pr-2">
            
            {/* Images */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Premium Photos</h4>
              <div className="grid grid-cols-2 gap-2">
                {IMAGES.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => onSelect(img.id)}
                    className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer ${
                      isSelected(img.id) ? 'border-primary shadow-md' : 'border-transparent'
                    }`}
                  >
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: img.id }} />
                    <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors" />
                    {isSelected(img.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white drop-shadow-md">
                      {img.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gradients */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mesh Gradients</h4>
              <div className="grid grid-cols-2 gap-2">
                {GRADIENTS.map((grad) => (
                  <button
                    key={grad.id}
                    onClick={() => onSelect(grad.id)}
                    className={`relative h-12 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer bg-gradient-to-br ${grad.id} ${
                      isSelected(grad.id) ? 'border-primary shadow-md' : 'border-transparent'
                    }`}
                  >
                    {isSelected(grad.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white drop-shadow-md">
                      {grad.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Solid Colors */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Solid Colors</h4>
              <div className="grid grid-cols-4 gap-2">
                {SOLID_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => onSelect(color.id)}
                    className={`relative aspect-square rounded-xl border-2 transition-all hover:scale-110 cursor-pointer ${color.id} ${
                      isSelected(color.id) ? 'border-primary shadow-md' : 'border-transparent'
                    }`}
                    title={color.name}
                  >
                    {isSelected(color.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

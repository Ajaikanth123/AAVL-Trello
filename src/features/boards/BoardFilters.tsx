import { Search, Tag, X } from 'lucide-react';
import type { Label } from '../../types/board';

interface BoardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeLabels: string[];
  onToggleLabel: (labelId: string) => void;
  availableLabels: Label[];
}

export default function BoardFilters({
  searchQuery,
  onSearchChange,
  activeLabels,
  onToggleLabel,
  availableLabels
}: BoardFiltersProps) {
  const hasActiveFilters = searchQuery.length > 0 || activeLabels.length > 0;

  const clearFilters = () => {
    onSearchChange('');
    // clear all active labels
    activeLabels.forEach(id => onToggleLabel(id)); // This toggles them off one by one, wait no, better to pass an onClear callback.
  };

  return (
    <div className="px-6 py-3 bg-black/10 dark:bg-black/30 backdrop-blur-sm border-b border-border/20 flex flex-wrap items-center gap-4 z-10 transition-all">
      
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-64 pl-9 pr-3 py-1.5 text-xs bg-white/50 dark:bg-zinc-900/50 border border-white/30 dark:border-zinc-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/80 dark:focus:bg-zinc-900/80 text-foreground transition-all shadow-sm placeholder:text-muted-foreground/70"
        />
        {searchQuery && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="w-px h-6 bg-border/40" />

      {/* Label Filters */}
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Labels:</span>
        <div className="flex flex-wrap gap-1.5">
          {availableLabels.map(label => {
            const isActive = activeLabels.includes(label.id);
            const baseColor = label.color.split(' ')[0]; // e.g. 'bg-red-500'
            
            return (
              <button
                key={label.id}
                onClick={() => onToggleLabel(label.id)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                  isActive 
                    ? `${baseColor} border-transparent text-white shadow-sm scale-105` 
                    : `bg-white/30 dark:bg-zinc-900/30 border-white/20 dark:border-zinc-800 hover:bg-white/50 dark:hover:bg-zinc-900/50 text-foreground opacity-70 hover:opacity-100`
                }`}
              >
                {label.name}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Clear All */}
      {hasActiveFilters && (
         <div className="ml-auto">
            <button 
              onClick={() => {
                onSearchChange('');
                activeLabels.forEach(id => onToggleLabel(id)); // Toggle off all active
              }}
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
         </div>
      )}

    </div>
  );
}

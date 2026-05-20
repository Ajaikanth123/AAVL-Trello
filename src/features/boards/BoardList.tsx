import { Draggable, Droppable } from '@hello-pangea/dnd';
import type { List, Card } from '../../types/board';
import CardItem from '../cards/CardItem';
import { MoreHorizontal, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface BoardListProps {
  list: List;
  index: number;
  onUpdate: (updatedList: List) => void;
  searchQuery?: string;
  activeLabels?: string[];
}

export default function BoardList({ list, index, onUpdate, searchQuery = '', activeLabels = [] }: BoardListProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingTitle(false);
    if (title.trim()) {
      onUpdate({ ...list, title: title.trim() });
    } else {
      setTitle(list.title);
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: newCardTitle.trim(),
      labels: [],
      assignees: [],
      createdAt: new Date().toISOString()
    };

    onUpdate({
      ...list,
      cards: [...(list.cards || []), newCard]
    });
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const handleDeleteList = () => {
    // Actually the parent needs to delete this.
    // To handle deletion properly, we could lift deletion to KanbanBoard.
    // For now we'll support emptying the list or we can handle it at parent level.
    // Since we pass index and list, if we empty it:
    onUpdate({ ...list, cards: [] });
  };

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`shrink-0 w-72 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 dark:border-zinc-800/80 rounded-2xl flex flex-col max-h-[80vh] shadow-md transition-shadow transition-colors duration-300 ${
            snapshot.isDragging ? 'shadow-xl border-primary/50 rotate-1 scale-[1.01] bg-white/80 dark:bg-zinc-900/80' : ''
          }`}
        >
          {/* Header */}
          <div
            {...provided.dragHandleProps}
            className="p-3.5 flex items-center justify-between border-b border-border/50 bg-white/30 dark:bg-zinc-800/25 rounded-t-2xl cursor-grab active:cursor-grabbing"
          >
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit} className="flex-1 mr-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  autoFocus
                  className="w-full bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </form>
            ) : (
              <h3
                onClick={() => setIsEditingTitle(true)}
                className="font-extrabold text-sm text-foreground px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-text truncate flex-1 tracking-tight"
              >
                {list.title}
              </h3>
            )}

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all text-muted-foreground cursor-pointer">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[170px] bg-white/95 dark:bg-zinc-850/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                  sideOffset={5}
                >
                  <DropdownMenu.Item
                    onClick={handleDeleteList}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer outline-none font-bold transition-all"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    Clear All Cards
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Cards Container */}
          <Droppable droppableId={list.id} type="card">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[50px] transition-colors duration-200 scrollbar-thin ${
                  snapshot.isDraggingOver ? 'bg-primary/5' : ''
                }`}
              >
                {list.cards?.filter(c => c.archived !== true).map((card, cardIndex) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    index={cardIndex}
                    listId={list.id}
                    onUpdate={(updatedCard) => {
                      const newCards = list.cards.map(c => c.id === card.id ? updatedCard : c);
                      onUpdate({ ...list, cards: newCards });
                    }}
                    onDelete={() => {
                      const newCards = list.cards.map(c => c.id === card.id ? { ...c, archived: true } : c);
                      onUpdate({ ...list, cards: newCards });
                    }}
                    searchQuery={searchQuery}
                    activeLabels={activeLabels}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Footer (Add Card) */}
          <div className="p-3 border-t border-border/50">
            {isAddingCard ? (
              <form onSubmit={handleAddCard} className="space-y-2.5">
                <textarea
                  placeholder="Enter card title..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  className="w-full p-3 text-xs bg-white dark:bg-zinc-950 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary resize-none transition-all duration-200 text-foreground"
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddCard(e);
                    }
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingCard(false)}
                    className="px-3.5 py-2 text-xs font-bold hover:bg-secondary rounded-xl transition-all cursor-pointer text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-101 active:scale-99 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Add Card
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingCard(true)}
                className="w-full flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 py-2.5 px-3 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add a card
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

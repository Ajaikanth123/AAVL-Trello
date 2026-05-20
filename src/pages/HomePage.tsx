import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '../api/boards';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../context/AuthContext';

const BACKGROUND_OPTIONS = [
  { type: 'gradient', value: 'from-esperia-purple to-esperia-pink', name: 'AAVL Aurora' },
  { type: 'color', value: 'bg-indigo-600', name: 'Royal Indigo' },
  { type: 'color', value: 'bg-emerald-600', name: 'Emerald Forest' },
  { type: 'color', value: 'bg-amber-500', name: 'Warm Amber' },
  { type: 'gradient', value: 'from-blue-600 to-cyan-500', name: 'Ocean Breeze' },
];

export default function HomePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_OPTIONS[0]);
  const { user } = useAuth();

  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: boardsApi.fetchBoards,
  });

  const createBoardMutation = useMutation({
    mutationFn: () => {
      const boardId = `board-${Date.now()}`;
      return boardsApi.createBoard(boardId, user?.id || 'local-user', {
        lists: [
          { id: `list-${Date.now()}-1`, title: 'To Do', cards: [] },
          { id: `list-${Date.now()}-2`, title: 'In Progress', cards: [] },
          { id: `list-${Date.now()}-3`, title: 'Done', cards: [] },
        ],
      });
    },
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setIsOpen(false);
      setBoardTitle('');
      // Save selected background color to localStorage for aesthetic integration!
      localStorage.setItem(`aavl_board_bg_${newBoard.id}`, selectedBg.value);
      // Immediately navigate inside the board!
      navigate(`/boards/${newBoard.id}`);
    },
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardTitle.trim()) return;
    createBoardMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Your Workspaces</h1>
        
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm font-semibold cursor-pointer">
              <Plus className="w-4 h-4" />
              Create New Board
            </button>
          </Dialog.Trigger>
          
          <Dialog.Portal>
            <Dialog.Overlay className="bg-black/50 backdrop-blur-sm fixed inset-0 z-50 animate-in fade-in" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-800 border border-border p-6 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-lg font-bold text-foreground">
                  Create Board
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-1 hover:bg-secondary rounded text-muted-foreground">
                    <X className="w-4.5 h-4.5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleCreateBoard} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Board Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Marketing Plan, School Project"
                    value={boardTitle}
                    onChange={(e) => setBoardTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground block">Background Style</label>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUND_OPTIONS.map((bg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedBg(bg)}
                        title={bg.name}
                        className={`h-10 rounded-lg overflow-hidden border-2 transition-all relative ${
                          selectedBg.value === bg.value 
                            ? 'border-primary scale-105 shadow-sm' 
                            : 'border-transparent hover:scale-105'
                        } ${bg.type === 'gradient' ? `bg-gradient-to-br ${bg.value}` : bg.value}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={createBoardMutation.isPending || !boardTitle.trim()}
                    className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {createBoardMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {boards?.map((board) => {
            const boardBg = localStorage.getItem(`aavl_board_bg_${board.id}`) || 'bg-indigo-600';
            return (
              <Link
                key={board.id}
                to={`/boards/${board.id}`}
                className={`group block h-32 p-4 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden text-white ${
                  boardBg.startsWith('from-') ? `bg-gradient-to-br ${boardBg}` : boardBg
                }`}
              >
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-bold text-lg relative z-10 drop-shadow-sm truncate">
                  {board.id.startsWith('board-demo') ? 'Demo Workspace' : `Workspace ${board.id.substring(8, 12)}`}
                </h3>
              </Link>
            );
          })}
          {(!boards || boards.length === 0) && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground mb-4">You don't have any boards yet.</p>
              <button 
                onClick={() => setIsOpen(true)}
                className="text-primary hover:underline font-semibold"
              >
                Create your first board
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

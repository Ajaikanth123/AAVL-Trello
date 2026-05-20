import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '../api/boards';
import type { Card } from '../types/board';
import KanbanBoard from '../features/boards/KanbanBoard';
import BackgroundSelector from '../features/boards/BackgroundSelector';
import BoardFilters from '../features/boards/BoardFilters';
import type { Label } from '../types/board';
import { useState, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Share2, Archive, Shield, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../api/firebase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface SharedMember {
  email: string;
  role: 'Admin' | 'Member' | 'Observer';
  isOwner?: boolean;
}

export default function BoardViewPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Hello! I am your AAVL AI Copilot. Try asking me: "Create 3 tasks for building a website landing page" or "Generate a quick launch checklist".' }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sharing Dialog States
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member' | 'Observer'>('Member');

  // Archiving States
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLabels, setActiveLabels] = useState<string[]>([]);

  const PRESET_LABELS: Label[] = [
    { id: '1', name: 'Urgent', color: 'bg-red-500 text-white' },
    { id: '2', name: 'Design', color: 'bg-blue-500 text-white' },
    { id: '3', name: 'Development', color: 'bg-emerald-500 text-white' },
    { id: '4', name: 'Planning', color: 'bg-amber-500 text-white' }
  ];

  const handleToggleLabel = (labelId: string) => {
    setActiveLabels(prev => 
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  };

  const { data: board, isLoading } = useQuery({
    queryKey: ['boards', boardId],
    queryFn: () => boardsApi.fetchBoardById(boardId!),
    enabled: !!boardId,
  });

  // Initialize members if not present - only board creator is owner
  useEffect(() => {
    if (board && user?.email && (!board.data.members || board.data.members.length === 0)) {
      // First time - set current user as owner
      const initialMembers = [{ email: user.email, role: 'Admin' as const, isOwner: true }];
      const newBoardData = { ...board.data, members: initialMembers };
      updateBoardMutation.mutate(newBoardData);
    }
  }, [board?.id, user?.email]);

  // Get board members from board data
  const boardMembers = board?.data.members || [];
  const sharedMembers = boardMembers;

  // Get current user's role and permissions
  const currentUserMember = sharedMembers.find(m => m.email === user?.email);
  const currentUserRole = currentUserMember?.role || 'Observer';
  const isOwner = currentUserMember?.isOwner || false;
  
  // Permission flags
  const canManageMembers = isOwner; // Only owner can manage members
  const canCreateCards = isOwner; // Only owner can create cards
  const canEditCards = isOwner || currentUserRole === 'Member'; // Owner and Members can edit
  const canDragCards = isOwner || currentUserRole === 'Member'; // Owner and Members can drag
  const canViewOnly = currentUserRole === 'Observer'; // Observers can only view

  // Sync members to board data
  const syncMembersToBoard = (members: SharedMember[]) => {
    if (!board) return;
    const newBoardData = { ...board.data, members };
    updateBoardMutation.mutate(newBoardData);
  };

  useEffect(() => {
    if (!boardId) return;

    const isFirebaseConfigured =
      import.meta.env.VITE_FIREBASE_DATABASE_URL &&
      import.meta.env.VITE_FIREBASE_DATABASE_URL !== 'https://your-project-default-rtdb.firebaseio.com';
    
    if (!isFirebaseConfigured) return;

    const boardRef = ref(database, `boards/${boardId}`);
    
    const unsubscribe = onValue(boardRef, (_snapshot) => {
      console.log('Realtime database update received from Firebase');
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
    });

    return () => {
      off(boardRef, 'value', unsubscribe);
    };
  }, [boardId, queryClient]);

  const updateBoardMutation = useMutation({
    mutationFn: async (newBoardData: any) => {
      return boardsApi.updateBoard(boardId!, newBoardData);
    },
    onMutate: async (newBoardData) => {
      await queryClient.cancelQueries({ queryKey: ['boards', boardId] });
      const previousBoard = queryClient.getQueryData(['boards', boardId]);
      
      queryClient.setQueryData(['boards', boardId], (old: any) => ({
        ...old,
        data: newBoardData
      }));

      return { previousBoard };
    },
    onError: (_err, _newBoardData, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['boards', boardId], context.previousBoard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
    },
  });

  const handleSendAiPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !board) return;

    const userPrompt = input.trim().toLowerCase();
    const newMsg: Message = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking
      
      const newBoardData = { ...board.data };
      const lists = newBoardData.lists || [];
      
      // Feature 1: Board Analysis / Summarization
      if (userPrompt.includes('summarize') || userPrompt.includes('analyze') || userPrompt.includes('how many') || userPrompt.includes('status')) {
        let totalCards = 0;
        let completedCards = 0;
        let overdueCards = 0;
        
        lists.forEach(list => {
          (list.cards || []).forEach(card => {
            if (!card.archived) totalCards++;
            if (card.dueCompleted) completedCards++;
            
            if (card.dueDate && !card.dueCompleted) {
              const due = new Date(card.dueDate + 'T23:59:59');
              if (due.getTime() < new Date().getTime()) overdueCards++;
            }
          });
        });

        const summaryText = `Here's a quick summary of your board:\n\n- **Total Cards**: ${totalCards}\n- **Completed Tasks**: ${completedCards}\n- **Overdue Tasks**: ${overdueCards}\n- **Lists**: ${lists.length}\n\nYou're doing great! Keep it up.`;
        
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: summaryText }]);
        setIsGenerating(false);
        return;
      }

      // Feature 2: Smart Routing (Find target list based on prompt)
      let targetListIndex = 0; // default to first list
      for (let i = 0; i < lists.length; i++) {
        if (userPrompt.includes(lists[i].title.toLowerCase())) {
          targetListIndex = i;
          break;
        }
      }

      // Feature 3: Rich Card Generation
      let generatedCardsData: any[] = [];
      
      if (userPrompt.includes('website') || userPrompt.includes('landing') || userPrompt.includes('app')) {
        generatedCardsData = [
          {
            title: 'Design Hero Section',
            desc: 'Create wireframes and high-fidelity mockups for the main hero section of the landing page.',
            labelId: '2', // Design
            subtasks: ['Gather reference materials', 'Create wireframes in Figma', 'Finalize color palette', 'Get stakeholder approval']
          },
          {
            title: 'Setup React Application',
            desc: 'Initialize Vite project, configure Tailwind CSS, and set up routing.',
            labelId: '3', // Development
            subtasks: ['Run npm create vite', 'Install tailwindcss', 'Setup react-router']
          }
        ];
      } else if (userPrompt.includes('marketing') || userPrompt.includes('campaign') || userPrompt.includes('ad')) {
        generatedCardsData = [
          {
            title: 'Define Target Demographics',
            desc: 'Research and outline the core target audience for the upcoming campaign.',
            labelId: '4', // Planning
            subtasks: ['Analyze competitor audiences', 'Draft user personas', 'Present to marketing team']
          },
          {
            title: 'Create Social Media Assets',
            desc: 'Design banners and ad graphics for Twitter, LinkedIn, and Facebook.',
            labelId: '2', // Design
            subtasks: ['Twitter Hero Image', 'LinkedIn Carousel', 'Facebook Ad Banner']
          }
        ];
      } else if (userPrompt.includes('bug') || userPrompt.includes('fix') || userPrompt.includes('error')) {
        generatedCardsData = [
          {
            title: 'Investigate Authentication Crash',
            desc: 'Users are reporting a crash when trying to log in using OAuth. Investigate Sentry logs.',
            labelId: '1', // Urgent
            subtasks: ['Reproduce issue locally', 'Check Sentry stack trace', 'Deploy hotfix']
          }
        ];
      } else {
        // Fallback generic generation
        generatedCardsData = [
          {
            title: 'Plan Project Objectives',
            desc: 'Draft the core goals and milestones for this new initiative.',
            labelId: '4',
            subtasks: ['Write PRD', 'Set deadlines']
          },
          {
            title: 'Assign Team Roles',
            desc: 'Determine responsibilities for team members.',
            labelId: '4',
            subtasks: []
          }
        ];
      }

      // Build the actual Card objects
      if (lists.length > 0) {
        const targetList = { ...lists[targetListIndex] };
        const newCards = [...(targetList.cards || [])];
        
        generatedCardsData.forEach((data, idx) => {
          const label = PRESET_LABELS.find(l => l.id === data.labelId);
          newCards.push({
            id: `ai-card-${Date.now()}-${idx}`,
            title: data.title,
            description: data.desc + '\n\n*(Automatically generated by AAVL AI Copilot)*',
            labels: label ? [label] : [],
            assignees: [],
            checklist: data.subtasks.map((st: string, stIdx: number) => ({
              id: `ai-chk-${Date.now()}-${idx}-${stIdx}`,
              title: st,
              completed: false
            })),
            createdAt: new Date().toISOString()
          });
        });

        targetList.cards = newCards;
        newBoardData.lists[targetListIndex] = targetList;
        updateBoardMutation.mutate(newBoardData);

        const aiResponseText = `Success! I have automatically created ${generatedCardsData.length} structured tasks in the **"${targetList.title}"** list.\n\nThey include detailed descriptions, automatic labels, and subtask checklists!`;
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponseText }]);
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: 'You need to create at least one list on your board first before I can add tasks!' }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue while analyzing the board or generating tasks.'
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !boardId || !board) return;

    // Check if already invited
    if (sharedMembers.some(m => m.email === inviteEmail.trim())) {
      alert('This user is already a member of this board.');
      return;
    }

    try {
      const response = await fetch('/api/boards/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          boardId: boardId,
          role: inviteRole,
        }),
      });

      // Try to parse JSON, but fall back to plain text if not JSON
      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        alert(`Success: ${data?.message || 'Invitation sent.'}`);
        
        // Add member to board data - NEVER as owner
        const newMember = { 
          email: inviteEmail.trim(), 
          role: inviteRole,
          isOwner: false // Invited members are NEVER owners
        };
        const updatedMembers = [...sharedMembers, newMember];
        syncMembersToBoard(updatedMembers);
        
        setInviteEmail('');
      } else {
        const errMsg = data?.error || data?.message || response.statusText || 'Unknown error';
        alert(`Error: ${errMsg}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send invitation email.');
    }
  };

  // Get all archived cards across all lists
  const getArchivedCards = () => {
    const archived: { card: Card; listId: string; listTitle: string }[] = [];
    board?.data.lists?.forEach(list => {
      list.cards?.forEach(card => {
        if (card.archived === true) {
          archived.push({ card, listId: list.id, listTitle: list.title });
        }
      });
    });
    return archived;
  };

  const restoreCard = (cardId: string, listId: string) => {
    if (!board) return;
    const newLists = board.data.lists.map(list => {
      if (list.id === listId) {
        const newCards = list.cards.map(card => {
          if (card.id === cardId) {
            return { ...card, archived: false };
          }
          return card;
        });
        return { ...list, cards: newCards };
      }
      return list;
    });
    updateBoardMutation.mutate({ ...board.data, lists: newLists });
  };

  const deleteCardPermanently = (cardId: string, listId: string) => {
    if (!board) return;
    const newLists = board.data.lists.map(list => {
      if (list.id === listId) {
        const newCards = list.cards.filter(card => card.id !== cardId);
        return { ...list, cards: newCards };
      }
      return list;
    });
    updateBoardMutation.mutate({ ...board.data, lists: newLists });
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading board...</div>;
  }

  if (!board) {
    return <div className="flex-1 flex items-center justify-center">Board not found</div>;
  }

  const handleBackgroundChange = (bg: string) => {
    if (!board) return;
    const newBoardData = { ...board.data, background: bg };
    updateBoardMutation.mutate(newBoardData);
  };

  const boardBg = board.data.background || 'bg-indigo-600';
  const isGradient = boardBg.startsWith('from-');
  const isImage = boardBg.startsWith('url(');

  const containerStyle = isImage ? { backgroundImage: boardBg, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  const containerClass = `flex-1 flex flex-col overflow-hidden relative text-white ${
    isImage ? '' : isGradient ? `bg-gradient-to-br ${boardBg}` : boardBg
  }`;

  return (
    <div className={containerClass} style={containerStyle}>
      {/* Board Header */}
      <div className="h-14 bg-background/45 backdrop-blur-xl border-b border-border/30 px-6 flex items-center justify-between z-10 text-foreground">
        <h2 className="font-bold text-lg">Board {board.id.substring(0, 8)}</h2>
        
        <div className="flex items-center gap-2">
          {/* Background Selector */}
          <BackgroundSelector 
            currentBackground={boardBg} 
            onSelect={handleBackgroundChange} 
          />

          {/* Share Board Button */}
          <Dialog.Root open={isShareOpen} onOpenChange={setIsShareOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 hover:bg-white/60 dark:hover:bg-zinc-900/60 backdrop-blur-md font-bold transition-all text-xs cursor-pointer shadow-xs">
                <Share2 className="w-4 h-4 text-primary" />
                Share
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="bg-black/40 backdrop-blur-md fixed inset-0 z-50 animate-in fade-in duration-200" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-800/80 p-6 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-foreground">
                <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2"><Share2 className="w-5 h-5 text-primary" /> Share Board</Dialog.Title>
                <Dialog.Description className="sr-only">Invite teammates to this board</Dialog.Description>
                  <Dialog.Close asChild>
                    <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-muted-foreground transition-all cursor-pointer">
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleInvite} className="space-y-4 mb-6">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="teammate@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/5 dark:bg-white/5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-xs transition-all"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="px-2.5 py-2 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                    >
                      <option>Member</option>
                      <option>Admin</option>
                      <option>Observer</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-sm hover:scale-101 active:scale-99"
                    >
                      Invite
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Members</h4>
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {sharedMembers.map(member => (
                      <div key={member.email} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6.5 h-6.5 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-[10px]">
                            {member.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-foreground font-semibold truncate max-w-[180px]">{member.email}</span>
                            {member.email === user?.email && <span className="text-[9px] text-muted-foreground">(You)</span>}
                          </div>
                        </div>
                        
                        {member.isOwner || member.email === user?.email ? (
                          <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3" />
                            {member.isOwner ? 'Owner' : member.role}
                          </span>
                        ) : canManageMembers ? (
                          <div className="flex items-center gap-2">
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <button className="flex items-center gap-1 text-[10px] bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer">
                                  <Shield className="w-3 h-3 text-primary" />
                                  {member.role}
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content className="min-w-[120px] bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-lg p-1 z-50">
                                  {(['Admin', 'Member', 'Observer'] as const).map(role => (
                                    <DropdownMenu.Item
                                      key={role}
                                      onClick={() => {
                                        const updatedMembers = sharedMembers.map(m => 
                                          m.email === member.email ? { ...m, role } : m
                                        );
                                        syncMembersToBoard(updatedMembers);
                                      }}
                                      className="px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/10 rounded cursor-pointer outline-none"
                                    >
                                      {role}
                                    </DropdownMenu.Item>
                                  ))}
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                            
                            <button
                              onClick={() => {
                                const updatedMembers = sharedMembers.filter(m => m.email !== member.email);
                                syncMembersToBoard(updatedMembers);
                              }}
                              className="p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                              title="Remove member"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] bg-black/5 dark:bg-white/5 text-muted-foreground font-bold px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3 text-primary" />
                            {member.role}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Archived Items Button */}
          <Dialog.Root open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 hover:bg-white/60 dark:hover:bg-zinc-900/60 backdrop-blur-md font-bold transition-all text-xs cursor-pointer shadow-xs">
                <Archive className="w-4 h-4 text-primary" />
                Archived
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="bg-black/40 backdrop-blur-md fixed inset-0 z-50 animate-in fade-in duration-200" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-800/80 p-6 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-foreground">
                <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2"><Archive className="w-5 h-5 text-primary" /> Archived Items</Dialog.Title>
                <Dialog.Description className="sr-only">View and manage archived items</Dialog.Description>
                  <Dialog.Close asChild>
                    <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-muted-foreground transition-all cursor-pointer">
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {getArchivedCards().map(({ card, listId, listTitle }) => (
                    <div key={card.id} className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-xs gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-bold truncate leading-snug">{card.title}</p>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block font-medium">Original List: {listTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => restoreCard(card.id, listId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold transition-all text-[10px]"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Restore
                        </button>
                        <button
                          onClick={() => deleteCardPermanently(card.id, listId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-bold transition-all text-[10px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {getArchivedCards().length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-6">No archived items found in this board.</p>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* AI Copilot toggle */}
          <button
            onClick={() => setIsAiOpen(prev => !prev)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-esperia-purple to-esperia-pink text-white font-bold shadow-md hover:shadow-lg hover:scale-102 active:scale-98 transition-all text-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            AI Copilot
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <BoardFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeLabels={activeLabels}
        onToggleLabel={handleToggleLabel}
        availableLabels={PRESET_LABELS}
      />

      {/* Board Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Kanban Board Container */}
        <div className="flex-1 overflow-x-auto p-6 flex items-start">
          <KanbanBoard 
            boardData={board.data} 
            onUpdate={(newData) => updateBoardMutation.mutate(newData)} 
            searchQuery={searchQuery}
            activeLabels={activeLabels}
            boardMembers={sharedMembers}
            canCreateCards={canCreateCards}
            canEditCards={canEditCards}
            canDragCards={canDragCards}
          />
        </div>

        {/* AI Copilot Panel */}
        <AnimatePresence>
          {isAiOpen && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-96 border-l border-border/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl flex flex-col h-full z-20 shadow-2xl relative text-foreground"
            >
              {/* AI Header */}
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-esperia-purple/10 to-esperia-pink/10 backdrop-blur-md">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Bot className="w-5 h-5 text-esperia-purple" />
                  AAVL AI Copilot
                </div>
                <button 
                  onClick={() => setIsAiOpen(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all text-muted-foreground cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white ${msg.sender === 'user' ? 'bg-primary' : 'bg-esperia-purple'}`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[75%] text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white border-primary shadow-md font-medium'
                        : 'bg-white/55 dark:bg-zinc-800/55 backdrop-blur-sm text-foreground border border-border/40 shadow-xs'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-esperia-purple flex items-center justify-center text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-2xl bg-white/55 dark:bg-zinc-800/55 backdrop-blur-sm text-muted-foreground border border-border/40 text-sm flex items-center gap-2 shadow-xs">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAiPrompt} className="p-4 border-t border-border/50 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-md">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask AI to create tasks..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isGenerating}
                    className="flex-1 bg-black/5 dark:bg-white/5 px-4 py-2 text-sm rounded-xl border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary disabled:opacity-50 text-foreground transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !input.trim()}
                    className="p-2 bg-primary text-white hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all rounded-xl font-medium disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

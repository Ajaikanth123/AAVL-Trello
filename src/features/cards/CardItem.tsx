import { Draggable } from '@hello-pangea/dnd';
import type { Card, Label, Activity, ChecklistItem } from '../../types/board';
import { AlignLeft, Trash, User, Tag, History, Check, Calendar, ListChecks, Plus, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

interface CardItemProps {
  card: Card;
  index: number;
  listId: string;
  onUpdate: (updatedCard: Card) => void;
  onDelete: () => void;
  searchQuery?: string;
  activeLabels?: string[];
}

const PRESET_MESSBERS = [
  { name: 'Alex Mercer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
  { name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces' },
  { name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' }
];

const PRESET_LABELS: Label[] = [
  { id: '1', name: 'Urgent', color: 'bg-red-500 text-white' },
  { id: '2', name: 'Design', color: 'bg-blue-500 text-white' },
  { id: '3', name: 'Development', color: 'bg-emerald-500 text-white' },
  { id: '4', name: 'Planning', color: 'bg-amber-500 text-white' }
];

function getDueDateStatus(dueDate: string | undefined, dueCompleted: boolean | undefined) {
  if (!dueDate) return null;
  if (dueCompleted) return 'completed';
  const now = new Date();
  const due = new Date(dueDate + 'T23:59:59');
  const diffMs = due.getTime() - now.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs < 0) return 'overdue';
  if (diffHrs < 24) return 'urgent';
  return 'future';
}

function DueDateBadge({ dueDate, dueCompleted }: { dueDate?: string; dueCompleted?: boolean }) {
  if (!dueDate) return null;
  const status = getDueDateStatus(dueDate, dueCompleted);
  const label = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const styles: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
    overdue: 'bg-red-500/15 text-red-500 border-red-500/25 animate-pulse',
    urgent: 'bg-amber-500/15 text-amber-500 border-amber-500/25',
    future: 'bg-zinc-500/10 dark:bg-zinc-800/50 text-muted-foreground border-border/40',
  };
  return (
    <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold border ${styles[status!]}`}>
      <Calendar className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

function ChecklistBadge({ checklist }: { checklist?: ChecklistItem[] }) {
  if (!checklist || checklist.length === 0) return null;
  const done = checklist.filter(i => i.completed).length;
  const total = checklist.length;
  const allDone = done === total;
  return (
    <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold border ${allDone ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' : 'bg-zinc-500/10 dark:bg-zinc-800/50 text-muted-foreground border-border/40'}`}>
      <ListChecks className="w-2.5 h-2.5" />
      {done}/{total}
    </span>
  );
}

export default function CardItem({ card, index, onUpdate, onDelete, searchQuery = '', activeLabels = [] }: CardItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState(card.description || '');
  const [newCheckItem, setNewCheckItem] = useState('');

  const logActivity = (text: string, currentCard: Card): Card => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      text,
      createdAt: new Date().toISOString()
    };
    return {
      ...currentCard,
      activities: [newActivity, ...(currentCard.activities || [])]
    };
  };

  const handleDescSave = () => {
    if (description === card.description) return;
    const updated = { ...card, description };
    const withActivity = logActivity(`Updated description`, updated);
    onUpdate(withActivity);
  };

  const toggleLabel = (label: Label) => {
    const exists = (card.labels || []).some(l => l.id === label.id);
    let updatedLabels: Label[];
    if (exists) {
      updatedLabels = (card.labels || []).filter(l => l.id !== label.id);
    } else {
      updatedLabels = [...(card.labels || []), label];
    }
    const updated = { ...card, labels: updatedLabels };
    const withActivity = logActivity(`${exists ? 'Removed' : 'Added'} label "${label.name}"`, updated);
    onUpdate(withActivity);
  };

  const toggleAssignee = (name: string) => {
    const exists = (card.assignees || []).includes(name);
    let updatedAssignees: string[];
    if (exists) {
      updatedAssignees = (card.assignees || []).filter(a => a !== name);
    } else {
      updatedAssignees = [...(card.assignees || []), name];
    }
    const updated = { ...card, assignees: updatedAssignees };
    const withActivity = logActivity(`${exists ? 'Unassigned' : 'Assigned'} ${name}`, updated);
    onUpdate(withActivity);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...card, dueDate: e.target.value || undefined };
    const withActivity = logActivity(`Set due date to ${e.target.value || 'none'}`, updated);
    onUpdate(withActivity);
  };

  const handleDueCompletedToggle = () => {
    const updated = { ...card, dueCompleted: !card.dueCompleted };
    const withActivity = logActivity(`Marked due date as ${updated.dueCompleted ? 'complete' : 'incomplete'}`, updated);
    onUpdate(withActivity);
  };

  const handleClearDueDate = () => {
    const updated = { ...card, dueDate: undefined, dueCompleted: false };
    const withActivity = logActivity('Cleared due date', updated);
    onUpdate(withActivity);
  };

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const item: ChecklistItem = {
      id: `ci-${Date.now()}`,
      title: newCheckItem.trim(),
      completed: false
    };
    const updated = { ...card, checklist: [...(card.checklist || []), item] };
    const withActivity = logActivity(`Added subtask "${item.title}"`, updated);
    onUpdate(withActivity);
    setNewCheckItem('');
  };

  const handleToggleCheckItem = (itemId: string) => {
    const newList = (card.checklist || []).map(i =>
      i.id === itemId ? { ...i, completed: !i.completed } : i
    );
    const item = newList.find(i => i.id === itemId);
    const updated = { ...card, checklist: newList };
    const withActivity = logActivity(`${item?.completed ? 'Completed' : 'Reopened'} subtask "${item?.title}"`, updated);
    onUpdate(withActivity);
  };

  const handleDeleteCheckItem = (itemId: string) => {
    const item = (card.checklist || []).find(i => i.id === itemId);
    const newList = (card.checklist || []).filter(i => i.id !== itemId);
    const updated = { ...card, checklist: newList };
    const withActivity = logActivity(`Removed subtask "${item?.title}"`, updated);
    onUpdate(withActivity);
  };

  const checklistTotal = (card.checklist || []).length;
  const checklistDone = (card.checklist || []).filter(i => i.completed).length;
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  // Filter Match Logic
  let isMatch = true;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const matchTitle = card.title.toLowerCase().includes(q);
    const matchDesc = card.description?.toLowerCase().includes(q) || false;
    if (!matchTitle && !matchDesc) isMatch = false;
  }
  if (isMatch && activeLabels.length > 0) {
    const cardLabelIds = (card.labels || []).map(l => l.id);
    const hasAllLabels = activeLabels.every(id => cardLabelIds.includes(id));
    if (!hasAllLabels) isMatch = false;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setIsOpen(true)}
            className={`group p-4 bg-white dark:bg-zinc-800 border border-border/70 rounded-2xl shadow-xs hover:shadow-md hover:border-primary/30 transition-colors transition-shadow duration-300 ease-out cursor-pointer select-none relative flex flex-col gap-3 ${
              snapshot.isDragging ? 'shadow-lg border-primary/50 scale-[1.02] rotate-1 bg-white/95 dark:bg-zinc-800/95' : ''
            } ${!isMatch && !snapshot.isDragging ? 'opacity-35 grayscale pointer-events-none' : ''}`}
          >
            {/* Active Label Pills */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {card.labels.map(l => (
                  <span
                    key={l.id}
                    className={`py-0.5 px-2.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border border-transparent shadow-xs ${l.color.split(' ')[0]} text-white bg-opacity-95`}
                    title={l.name}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-between items-start gap-2">
              <span className="text-sm font-semibold text-card-foreground break-words flex-1 leading-snug tracking-tight">
                {card.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all duration-200 cursor-pointer shrink-0"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Checklist Progress Bar (if subtasks exist) */}
            {checklistTotal > 0 && (
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${checklistPct === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${checklistPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Bottom details row: Description, Due Date Badge, Checklist Badge, Assignees */}
            <div className="flex items-center justify-between gap-2 mt-0.5 text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {card.description && (
                  <div className="flex items-center gap-1">
                    <AlignLeft className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold tracking-tight">Description</span>
                  </div>
                )}
                <DueDateBadge dueDate={card.dueDate} dueCompleted={card.dueCompleted} />
                <ChecklistBadge checklist={card.checklist} />
              </div>

              {/* Assignee Avatar Bubbles */}
              {card.assignees && card.assignees.length > 0 && (
                <div className="flex -space-x-1.5 overflow-hidden">
                  {card.assignees.map(name => {
                    const member = PRESET_MESSBERS.find(m => m.name === name);
                    return (
                      <div
                        key={name}
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-800 overflow-hidden shrink-0 shadow-xs"
                        title={name}
                      >
                        <img src={member?.avatar} alt={name} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {/* Card Details Modal */}
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 backdrop-blur-md fixed inset-0 z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-zinc-900 border border-border/80 p-7 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-300 max-h-[88vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-border/60">
            <div>
              <Dialog.Title className="text-xl font-extrabold text-foreground tracking-tight">
                {card.title}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-1">
                Customize, assign, and track activity logs
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-xs font-bold bg-secondary hover:bg-secondary/80 rounded-xl transition-all hover:scale-102 text-foreground cursor-pointer">
                Done
              </button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Content Area */}
            <div className="md:col-span-2 space-y-6">

              {/* Description Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-primary" />
                  Description
                </h4>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescSave}
                  placeholder="Add a more detailed description..."
                  className="w-full min-h-[100px] p-4 text-sm bg-black/5 dark:bg-zinc-800 border border-border/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all duration-200"
                />
              </div>

              {/* Checklist / Subtasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary" />
                    Subtasks
                    {checklistTotal > 0 && (
                      <span className="text-xs font-bold text-muted-foreground">
                        {checklistDone}/{checklistTotal}
                      </span>
                    )}
                  </h4>
                </div>

                {/* Progress Bar */}
                {checklistTotal > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground w-7 text-right shrink-0">{checklistPct}%</span>
                    <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${checklistPct === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                        style={{ width: `${checklistPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtask Items */}
                <div className="space-y-1.5">
                  {(card.checklist || []).map(item => (
                    <div
                      key={item.id}
                      className="group/item flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    >
                      <button
                        onClick={() => handleToggleCheckItem(item.id)}
                        className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          item.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {item.completed && <Check className="w-2.5 h-2.5" />}
                      </button>
                      <span className={`flex-1 text-xs font-medium transition-all ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.title}
                      </span>
                      <button
                        onClick={() => handleDeleteCheckItem(item.id)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Input */}
                <form onSubmit={handleAddCheckItem} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Add a subtask..."
                    value={newCheckItem}
                    onChange={e => setNewCheckItem(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-black/5 dark:bg-zinc-800 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newCheckItem.trim()}
                    className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Activity Log Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Activity History
                </h4>
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                  {(card.activities || []).map(act => (
                    <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        <History className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{act.text}</p>
                        <span className="text-[10px] text-muted-foreground">{new Date(act.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                  {(!card.activities || card.activities.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">No actions recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Control Panels */}
            <div className="space-y-5">

              {/* Due Date Panel */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-extrabold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Due Date
                </h5>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={card.dueDate || ''}
                    onChange={handleDueDateChange}
                    className="w-full px-3 py-2 text-xs bg-black/5 dark:bg-zinc-800 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer text-foreground"
                  />
                  {card.dueDate && (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={handleDueCompletedToggle}
                        className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          card.dueCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                            : 'border-border/60 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${card.dueCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-current'}`}>
                          {card.dueCompleted && <Check className="w-2 h-2 text-white" />}
                        </div>
                        {card.dueCompleted ? 'Completed ✓' : 'Mark Complete'}
                      </button>
                      <button
                        onClick={handleClearDueDate}
                        className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl border border-border/60 transition-all cursor-pointer"
                        title="Clear due date"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {/* Status Badge */}
                  {card.dueDate && (() => {
                    const status = getDueDateStatus(card.dueDate, card.dueCompleted);
                    const labels = { completed: '✓ Completed', overdue: '⚠ Overdue', urgent: '⏰ Due Soon', future: '📅 Upcoming' };
                    const styles: Record<string, string> = {
                      completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                      overdue: 'bg-red-500/10 text-red-500',
                      urgent: 'bg-amber-500/10 text-amber-500',
                      future: 'bg-zinc-500/10 text-muted-foreground',
                    };
                    return (
                      <div className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-bold text-center ${styles[status!]}`}>
                        {labels[status!]}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Assignees Panel */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-extrabold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Assign Team
                </h5>
                <div className="space-y-1.5">
                  {PRESET_MESSBERS.map(member => {
                    const isAssigned = (card.assignees || []).includes(member.name);
                    return (
                      <button
                        key={member.name}
                        onClick={() => toggleAssignee(member.name)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-101 cursor-pointer ${
                          isAssigned
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border/60 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={member.avatar} alt={member.name} className="w-5.5 h-5.5 rounded-full object-cover shadow-xs border border-white/20" />
                          <span>{member.name}</span>
                        </div>
                        {isAssigned && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Labels Panel */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-extrabold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Labels
                </h5>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_LABELS.map(lbl => {
                    const isActive = (card.labels || []).some(l => l.id === lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        onClick={() => toggleLabel(lbl)}
                        className={`py-2 px-2.5 rounded-xl text-[10px] font-bold text-center border transition-all hover:scale-[1.03] cursor-pointer ${
                          isActive
                            ? `${lbl.color.split(' ')[0]} text-white border-transparent shadow-xs scale-102`
                            : 'border-border/60 hover:bg-black/5 dark:hover:bg-white/5 text-foreground'
                        }`}
                      >
                        {lbl.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

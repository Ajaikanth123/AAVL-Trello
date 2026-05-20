import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { BoardData, BoardMember } from '../../types/board';
import BoardList from './BoardList';
import { Plus } from 'lucide-react';
import { useState, useEffect, useCallback, memo } from 'react';

interface KanbanBoardProps {
  boardData: BoardData;
  onUpdate: (newData: BoardData) => void;
  searchQuery?: string;
  activeLabels?: string[];
  boardMembers?: BoardMember[];
}

function KanbanBoard({ boardData, onUpdate, searchQuery = '', activeLabels = [], boardMembers = [] }: KanbanBoardProps) {
  const [lists, setLists] = useState(boardData.lists || []);

  // Sync with external boardData changes
  useEffect(() => {
    setLists(boardData.lists || []);
  }, [boardData.lists]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    setLists(currentLists => {
      const newLists = Array.from(currentLists);

      // Moving a list
      if (type === 'list') {
        const [removed] = newLists.splice(source.index, 1);
        newLists.splice(destination.index, 0, removed);
        
        // Update immediately for smooth UX
        onUpdate({ ...boardData, lists: newLists });
        return newLists;
      }

      // Moving a card
      const sourceListIndex = newLists.findIndex(list => list.id === source.droppableId);
      const destListIndex = newLists.findIndex(list => list.id === destination.droppableId);

      const sourceList = newLists[sourceListIndex];
      const destList = newLists[destListIndex];

      const sourceCards = Array.from(sourceList.cards || []);
      const destCards = source.droppableId === destination.droppableId 
        ? sourceCards 
        : Array.from(destList.cards || []);

      const [removedCard] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, removedCard);

      newLists[sourceListIndex] = { ...sourceList, cards: sourceCards };
      if (source.droppableId !== destination.droppableId) {
        newLists[destListIndex] = { ...destList, cards: destCards };
      }

      // Update immediately for smooth UX
      onUpdate({ ...boardData, lists: newLists });
      return newLists;
    });
  }, [boardData, onUpdate]);

  const addList = useCallback(() => {
    const newList = {
      id: `list-${Date.now()}`,
      title: 'New List',
      cards: []
    };
    const newLists = [...lists, newList];
    setLists(newLists);
    onUpdate({ ...boardData, lists: newLists });
  }, [lists, boardData, onUpdate]);

  const handleListUpdate = useCallback((index: number, updatedList: any) => {
    const newLists = [...lists];
    newLists[index] = updatedList;
    setLists(newLists);
    onUpdate({ ...boardData, lists: newLists });
  }, [lists, boardData, onUpdate]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="all-lists" direction="horizontal" type="list">
        {(provided) => (
          <div
            className="flex gap-4 items-start h-full"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {lists.map((list, index) => (
              <BoardList 
                key={list.id} 
                list={list} 
                index={index} 
                onUpdate={(updatedList) => handleListUpdate(index, updatedList)}
                searchQuery={searchQuery}
                activeLabels={activeLabels}
                boardMembers={boardMembers}
              />
            ))}
            {provided.placeholder}
            
            {/* Add List Button */}
            <div className="shrink-0 w-72">
              <button 
                onClick={addList}
                className="w-full flex items-center gap-2 bg-white/35 dark:bg-black/15 hover:bg-white/50 dark:hover:bg-black/25 backdrop-blur-md text-foreground py-3 px-4 rounded-xl transition-all duration-200 font-bold border border-white/10 shadow-xs cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Add another list
              </button>
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default memo(KanbanBoard);

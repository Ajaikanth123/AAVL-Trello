import { ref, get, set, update, child } from 'firebase/database';
import { database } from './firebase';
import type { Board, BoardData } from '../types/board';

// Helper to check if Firebase is actually configured
const isFirebaseConfigured = () => {
  const url = import.meta.env.VITE_FIREBASE_DATABASE_URL;
  return url && url !== 'https://your-project-default-rtdb.firebaseio.com';
};

// Local storage key for fallback
const LOCAL_BOARDS_KEY = 'aavl_local_boards';

const getLocalBoards = (): Board[] => {
  const stored = localStorage.getItem(LOCAL_BOARDS_KEY);
  if (!stored) {
    // Seed default boards
    const defaultBoards: Board[] = [
      {
        id: 'board-demo-1',
        owner_id: 'local-user',
        data: {
          lists: [
            {
              id: 'list-1',
              title: 'To Do',
              cards: [
                {
                  id: 'card-1',
                  title: 'Welcome to AAVL!',
                  description: 'This is a Kanban board clone built with React and Tailwind CSS.',
                  labels: [],
                  assignees: [],
                  createdAt: new Date().toISOString()
                },
                {
                  id: 'card-2',
                  title: 'Try Drag and Drop',
                  description: 'You can drag cards between lists or reorder them.',
                  labels: [],
                  assignees: [],
                  createdAt: new Date().toISOString()
                }
              ]
            },
            {
              id: 'list-2',
              title: 'In Progress',
              cards: []
            },
            {
              id: 'list-3',
              title: 'Done',
              cards: []
            }
          ]
        },
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(LOCAL_BOARDS_KEY, JSON.stringify(defaultBoards));
    return defaultBoards;
  }
  return JSON.parse(stored);
};

const saveLocalBoards = (boards: Board[]) => {
  localStorage.setItem(LOCAL_BOARDS_KEY, JSON.stringify(boards));
};

export const boardsApi = {
  async fetchBoards(): Promise<Board[]> {
    if (!isFirebaseConfigured()) {
      console.log('Using local fallback for fetchBoards');
      return getLocalBoards();
    }

    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'boards'));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      // data is an object with board IDs as keys
      const boardsArray: Board[] = Object.values(data);
      return boardsArray.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      return [];
    }
  },

  async fetchBoardById(id: string): Promise<Board> {
    if (!isFirebaseConfigured()) {
      console.log('Using local fallback for fetchBoardById');
      const boards = getLocalBoards();
      const board = boards.find(b => b.id === id);
      if (!board) throw new Error('Board not found locally');
      return board;
    }

    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `boards/${id}`));
    
    if (snapshot.exists()) {
      return snapshot.val() as Board;
    } else {
      throw new Error('Board not found');
    }
  },

  async createBoard(id: string, ownerId: string, initialData: BoardData): Promise<Board> {
    const newBoard: Board = {
      id,
      owner_id: ownerId,
      data: initialData,
      created_at: new Date().toISOString()
    };

    if (!isFirebaseConfigured()) {
      console.log('Using local fallback for createBoard');
      const boards = getLocalBoards();
      const updated = [newBoard, ...boards];
      saveLocalBoards(updated);
      return newBoard;
    }

    await set(ref(database, `boards/${id}`), newBoard);
    return newBoard;
  },

  async updateBoard(id: string, newData: BoardData): Promise<Board> {
    if (!isFirebaseConfigured()) {
      console.log('Using local fallback for updateBoard');
      const boards = getLocalBoards();
      const index = boards.findIndex(b => b.id === id);
      if (index === -1) throw new Error('Board not found');
      
      const updatedBoard = { ...boards[index], data: newData };
      boards[index] = updatedBoard;
      saveLocalBoards(boards);
      return updatedBoard;
    }

    await update(ref(database, `boards/${id}`), {
      data: newData
    });
    
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `boards/${id}`));
    return snapshot.val() as Board;
  }
};

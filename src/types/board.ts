export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Activity {
  id: string;
  text: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface BoardMember {
  email: string;
  name?: string;
  avatar?: string;
  role: 'Admin' | 'Member' | 'Observer';
  isOwner?: boolean;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  labels: Label[];
  assignees: string[]; // Email addresses of assigned members
  createdAt: string;
  activities?: Activity[];
  archived?: boolean;
  dueDate?: string;
  dueCompleted?: boolean;
  checklist?: ChecklistItem[];
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
}

export interface BoardData {
  lists: List[];
  background?: string;
  members?: BoardMember[]; // Shared members with roles
}

export interface Board {
  id: string;
  owner_id: string;
  data: BoardData;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
}

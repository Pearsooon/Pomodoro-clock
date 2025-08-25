export type PetRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Pet {
  id: string;
  name: string;
  description: string;
  rarity: PetRarity;
  image: string;
  sleepImage: string;
  unlockRequirement: {
    type: 'cycles' | 'level' | 'streak' | 'focus_time';
    value: number;
  };
  dropChance: number; // 0-1
}

export interface PetProgress {
  petId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface UserPet {
  petId: string;
  unlockedAt: Date;
  isCompanion: boolean;
  progress: PetProgress;
}

export const RARITY_STYLES: Record<PetRarity, { border: string; bg: string; text: string }> = {
  Common: { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-700' },
  Rare: { border: 'border-blue-400', bg: 'bg-blue-100', text: 'text-blue-700' },
  Epic: { border: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-700' },
  Legendary: { border: 'border-yellow-400', bg: 'bg-yellow-100', text: 'text-yellow-700' }
};
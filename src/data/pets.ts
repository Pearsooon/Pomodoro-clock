import { Pet } from '@/types/pet';
import petAwake from '@/assets/pet-awake.png';
import petSleeping from '@/assets/pet-sleeping.png';

export const PETS: Pet[] = [
  {
    id: 'focus-buddy',
    name: 'Focus Buddy',
    description: 'Your loyal companion that helps you stay focused. A reliable friend for beginners.',
    rarity: 'Common',
    image: petAwake,
    sleepImage: petSleeping,
    unlockRequirement: { type: 'cycles', value: 0 },
    dropChance: 1.0
  },
  {
    id: 'zen-cat',
    name: 'Zen Cat',
    description: 'A peaceful feline that promotes deep concentration. Unlocked through consistent practice.',
    rarity: 'Rare',
    image: petAwake,
    sleepImage: petSleeping,
    unlockRequirement: { type: 'cycles', value: 25 },
    dropChance: 0.3
  },
  {
    id: 'wisdom-owl',
    name: 'Wisdom Owl',
    description: 'An ancient owl that guides long study sessions. Perfect for extended focus periods.',
    rarity: 'Epic',
    image: petAwake,
    sleepImage: petSleeping,
    unlockRequirement: { type: 'focus_time', value: 1200 }, // 20 hours
    dropChance: 0.15
  },
  {
    id: 'phoenix-flame',
    name: 'Phoenix Flame',
    description: 'A legendary phoenix that rises with your dedication. Symbol of persistence and rebirth.',
    rarity: 'Legendary',
    image: petAwake,
    sleepImage: petSleeping,
    unlockRequirement: { type: 'streak', value: 30 },
    dropChance: 0.05
  },
  {
    id: 'study-panda',
    name: 'Study Panda',
    description: 'A studious panda that loves learning. Encourages consistent daily practice.',
    rarity: 'Rare',
    image: petAwake,
    sleepImage: petSleeping,
    unlockRequirement: { type: 'level', value: 10 },
    dropChance: 0.25
  },
  {
    id: 'mystic-dragon',
    name: 'Mystic Dragon',
    description: 'An ethereal dragon of ultimate focus. Reserved for the most dedicated practitioners.',
    rarity: 'Legendary',
    image: petAwake,
    sleepImage: petSleeping,
    unlockRequirement: { type: 'cycles', value: 500 },
    dropChance: 0.02
  }
];
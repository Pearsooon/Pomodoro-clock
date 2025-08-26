import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { PETS } from '@/data/pets';
import type { Pet, UserPet, PetProgress } from '@/types/pet';

type Ctx = {
  userPets: UserPet[];
  currentCompanion: Pet | null;
  unlockPet: (petId: string) => void;
  setAsCompanion: (petId: string) => void;
  isPetUnlocked: (petId: string) => boolean;
  getPetProgress: (petId: string) => PetProgress | null; // vẫn expose cho tương thích, trả null
  /** Giữ hàm để không phá code chỗ khác, nhưng không còn cộng XP */
  awardSessionXP: (minutesPerWork: number, cyclesCompleted: number) => number;
  checkForNewPetUnlocks: (args: {
    totalCycles: number;
    currentStreak: number;
    totalFocusMinutes: number;
    level: number;
  }) => Pet[];
};

const PetCollectionContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'pet_collection_v1';
const EVENT_PET_UNLOCKED = 'pet:unlocked';

const DEFAULT_USER_PETS: UserPet[] = [
  {
    petId: 'focus-buddy',
    unlockedAt: new Date(),
    isCompanion: true,
    // có thể giữ progress nhưng không dùng nữa
    progress: { petId: 'focus-buddy', level: 1, xp: 0, xpToNextLevel: 1000 },
  },
];

function normalizePets(pets: any): UserPet[] {
  if (!Array.isArray(pets)) return DEFAULT_USER_PETS;
  return pets.map((p: any): UserPet => ({
    petId: p.petId,
    unlockedAt: p.unlockedAt ? new Date(p.unlockedAt) : new Date(),
    isCompanion: !!p.isCompanion,
    progress: p.progress ?? { petId: p.petId, level: 1, xp: 0, xpToNextLevel: 1000 },
  }));
}

function loadFromStorage(): UserPet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PETS;
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : (parsed?.pets ?? DEFAULT_USER_PETS);
    return normalizePets(arr);
  } catch {
    return DEFAULT_USER_PETS;
  }
}
function saveToStorage(pets: UserPet[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pets)); } catch {}
}

export const PetCollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPets, setUserPets] = useState<UserPet[]>(() => loadFromStorage());

  useEffect(() => { saveToStorage(userPets); }, [userPets]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setUserPets(normalizePets(JSON.parse(e.newValue))); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isPetUnlocked = useCallback((petId: string) => {
    return userPets.some(p => p.petId === petId);
  }, [userPets]);

  const unlockPet = useCallback((petId: string) => {
    if (isPetUnlocked(petId)) return;
    const petMeta = PETS.find(p => p.id === petId);
    if (!petMeta) return;

    const newPet: UserPet = {
      petId,
      unlockedAt: new Date(),
      isCompanion: userPets.length === 0,
      progress: { petId, level: 1, xp: 0, xpToNextLevel: 1000 }, // giữ hình thức, không dùng
    };

    setUserPets(prev => [...prev, newPet]);
    try { window.dispatchEvent(new CustomEvent<Pet>(EVENT_PET_UNLOCKED, { detail: petMeta })); } catch {}
  }, [isPetUnlocked, userPets.length]);

  const setAsCompanion = useCallback((petId: string) => {
    setUserPets(prev => prev.map(p => ({ ...p, isCompanion: p.petId === petId })));
  }, []);

  // ❌ Không còn XP -> luôn trả null
  const getPetProgress = useCallback((_petId: string): PetProgress | null => {
    return null;
  }, []);

  const currentCompanion = useMemo(() => {
    const cur = userPets.find(p => p.isCompanion);
    return cur ? (PETS.find(pt => pt.id === cur.petId) ?? null) : null;
  }, [userPets]);

  // ❌ Bỏ cơ chế cộng XP (no-op để không phá chỗ khác đang gọi)
  const awardSessionXP = useCallback((_minutesPerWork: number, _cyclesCompleted: number) => {
    return 0;
  }, []);

  const checkForNewPetUnlocks: Ctx['checkForNewPetUnlocks'] = useCallback(({ totalCycles, currentStreak, totalFocusMinutes, level }) => {
    const newUnlocks: Pet[] = [];
    PETS.forEach(pet => {
      if (isPetUnlocked(pet.id)) return;
      const req = pet.unlockRequirement;
      let ok = false;
      switch (req.type) {
        case 'cycles':      ok = totalCycles >= req.value; break;
        case 'streak':      ok = currentStreak >= req.value; break;
        case 'focus_time':  ok = totalFocusMinutes >= req.value; break;
        case 'level':       ok = level >= req.value; break;
      }
      if (ok) {
        const chance = pet.dropChance ?? 1;
        if (Math.random() < chance) {
          unlockPet(pet.id);
          newUnlocks.push(pet);
        }
      }
    });
    return newUnlocks;
  }, [isPetUnlocked, unlockPet]);

  const value: Ctx = {
    userPets,
    currentCompanion,
    unlockPet,
    setAsCompanion,
    isPetUnlocked,
    getPetProgress,   // giờ luôn null
    awardSessionXP,   // no-op
    checkForNewPetUnlocks,
  };

  return <PetCollectionContext.Provider value={value}>{children}</PetCollectionContext.Provider>;
};

export function usePetCollection(): Ctx {
  const ctx = useContext(PetCollectionContext);
  if (!ctx) throw new Error('usePetCollection must be used within PetCollectionProvider');
  return ctx;
}

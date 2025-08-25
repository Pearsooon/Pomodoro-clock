import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { PETS } from '@/data/pets';
import type { Pet, UserPet, PetProgress } from '@/types/pet';

type Ctx = {
  userPets: UserPet[];
  currentCompanion: Pet | null;
  unlockPet: (petId: string) => void;
  setAsCompanion: (petId: string) => void;
  isPetUnlocked: (petId: string) => boolean;
  getPetProgress: (petId: string) => PetProgress | null;
  /** Gọi sau khi hoàn thành session để random rơi pet */
  checkForNewPetUnlocks: (args: {
    totalCycles: number;
    currentStreak: number;
    totalFocusMinutes: number;
    level: number;
  }) => Pet[]; // trả về danh sách pet mới mở khóa
};

const PetCollectionContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'pet_collection_v1';
const EVENT_PET_UNLOCKED = 'pet:unlocked';

const DEFAULT_USER_PETS: UserPet[] = [
  {
    petId: 'focus-buddy',
    unlockedAt: new Date(),
    isCompanion: true,
    progress: { petId: 'focus-buddy', level: 5, xp: 750, xpToNextLevel: 1000 },
  },
];

function loadFromStorage(): UserPet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PETS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : (parsed?.pets ?? DEFAULT_USER_PETS);
  } catch {
    return DEFAULT_USER_PETS;
  }
}
function saveToStorage(pets: UserPet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
  } catch {}
}

export const PetCollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPets, setUserPets] = useState<UserPet[]>(() => loadFromStorage());

  // Persist
  useEffect(() => { saveToStorage(userPets); }, [userPets]);

  // Sync nếu mở nhiều tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setUserPets(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isPetUnlocked = useCallback((petId: string) => {
    return userPets.some(p => p.petId === petId);
  }, [userPets]);

  const unlockPet = useCallback((petId: string) => {
    // Nếu đã có thì bỏ qua
    if (isPetUnlocked(petId)) return;

    const petMeta = PETS.find(p => p.id === petId);
    if (!petMeta) return;

    const newPet: UserPet = {
      petId,
      unlockedAt: new Date(),
      isCompanion: userPets.length === 0, // nếu là pet đầu tiên
      progress: { petId, level: 1, xp: 0, xpToNextLevel: 100 },
    };

    setUserPets(prev => [...prev, newPet]);

    // 🔔 Phát sự kiện toàn cục để HomeTab (hoặc nơi khác) bật modal
    try {
      window.dispatchEvent(new CustomEvent<Pet>(EVENT_PET_UNLOCKED, { detail: petMeta }));
    } catch {}
  }, [isPetUnlocked, userPets.length]);

  const setAsCompanion = useCallback((petId: string) => {
    setUserPets(prev => prev.map(p => ({ ...p, isCompanion: p.petId === petId })));
  }, []);

  const getPetProgress = useCallback((petId: string): PetProgress | null => {
    const up = userPets.find(p => p.petId === petId);
    return up?.progress ?? null;
  }, [userPets]);

  const currentCompanion = useMemo(() => {
    const cur = userPets.find(p => p.isCompanion);
    return cur ? (PETS.find(pt => pt.id === cur.petId) ?? null) : null;
  }, [userPets]);

  // Random rơi pet theo rule trong PETS
  const checkForNewPetUnlocks: Ctx['checkForNewPetUnlocks'] = useCallback(({ totalCycles, currentStreak, totalFocusMinutes, level }) => {
    const newUnlocks: Pet[] = [];

    PETS.forEach(pet => {
      if (isPetUnlocked(pet.id)) return;

      let ok = false;
      const req = pet.unlockRequirement;
      switch (req.type) {
        case 'cycles':      ok = totalCycles >= req.value; break;
        case 'streak':      ok = currentStreak >= req.value; break;
        case 'focus_time':  ok = totalFocusMinutes >= req.value; break;
        case 'level':       ok = level >= req.value; break;
      }

      if (ok) {
        const chance = pet.dropChance ?? 1;
        if (Math.random() < chance) {
          // dùng unlockPet để cập nhật + phát event
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
    getPetProgress,
    checkForNewPetUnlocks,
  };

  return <PetCollectionContext.Provider value={value}>{children}</PetCollectionContext.Provider>;
};

export function usePetCollection(): Ctx {
  const ctx = useContext(PetCollectionContext);
  if (!ctx) throw new Error('usePetCollection must be used within PetCollectionProvider');
  return ctx;
}

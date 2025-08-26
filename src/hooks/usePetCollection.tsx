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
  /** ✅ Cộng XP cho pet đang đồng hành khi hoàn thành 1 buổi học */
  awardSessionXP: (minutesPerWork: number, cyclesCompleted: number) => number;
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
const LEVEL_XP = 1; // ✅ mỗi level cần 1000 XP

const DEFAULT_USER_PETS: UserPet[] = [
  {
    petId: 'focus-buddy',
    unlockedAt: new Date(),
    isCompanion: true,
    progress: { petId: 'focus-buddy', level: 5, xp: 750, xpToNextLevel: LEVEL_XP },
  },
];

function normalizePets(pets: any): UserPet[] {
  if (!Array.isArray(pets)) return DEFAULT_USER_PETS;
  return pets.map((p: any): UserPet => ({
    petId: p.petId,
    unlockedAt: p.unlockedAt ? new Date(p.unlockedAt) : new Date(),
    isCompanion: !!p.isCompanion,
    progress: {
      petId: p.progress?.petId ?? p.petId,
      level: Number(p.progress?.level ?? 1),
      xp: Number(p.progress?.xp ?? 0),
      xpToNextLevel: LEVEL_XP, // ✅ chuẩn hoá về 1000
    },
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
    // Nếu đã có thì bỏ qua
    if (isPetUnlocked(petId)) return;

    const petMeta = PETS.find(p => p.id === petId);
    if (!petMeta) return;

    const newPet: UserPet = {
      petId,
      unlockedAt: new Date(),
      isCompanion: userPets.length === 0, // nếu là pet đầu tiên
      progress: { petId, level: 1, xp: 0, xpToNextLevel: LEVEL_XP }, // ✅ 1000 thay vì 100
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
    if (!up) return null;
    const pr = up.progress ?? { petId, level: 1, xp: 0, xpToNextLevel: LEVEL_XP };
    // ✅ đảm bảo xpToNextLevel luôn 1000 khi render
    return { ...pr, xpToNextLevel: LEVEL_XP };
  }, [userPets]);

  const currentCompanion = useMemo(() => {
    const cur = userPets.find(p => p.isCompanion);
    return cur ? (PETS.find(pt => pt.id === cur.petId) ?? null) : null;
  }, [userPets]);

  // ✅ Cộng XP cho pet đang đồng hành (minutes × cycles) và tự động lên level
  const awardSessionXP = useCallback((minutesPerWork: number, cyclesCompleted: number) => {
    const gain = Math.max(0, Math.floor(minutesPerWork * cyclesCompleted));
    if (gain === 0) return 0;

    setUserPets(prev => prev.map(p => {
      if (!p.isCompanion) return p; // chỉ cộng cho companion
      const cur = p.progress ?? { petId: p.petId, level: 1, xp: 0, xpToNextLevel: LEVEL_XP };

      let level = cur.level;
      let xp = cur.xp + gain;

      // Auto level-up; có thể vượt nhiều cấp
      while (xp >= LEVEL_XP) {
        xp -= LEVEL_XP;
        level += 1;
      }

      return {
        ...p,
        progress: { petId: p.petId, level, xp, xpToNextLevel: LEVEL_XP },
      };
    }));

    return gain;
  }, []);

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
    awardSessionXP,          // ✅ expose
    checkForNewPetUnlocks,
  };

  return <PetCollectionContext.Provider value={value}>{children}</PetCollectionContext.Provider>;
};

export function usePetCollection(): Ctx {
  const ctx = useContext(PetCollectionContext);
  if (!ctx) throw new Error('usePetCollection must be used within PetCollectionProvider');
  return ctx;
}

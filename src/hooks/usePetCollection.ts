import { useState, useEffect } from 'react';
import { Pet, UserPet, PetProgress } from '@/types/pet';
import { PETS } from '@/data/pets';

export const usePetCollection = () => {
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [currentCompanion, setCurrentCompanion] = useState<Pet | null>(null);

  // Initialize with default pet
  useEffect(() => {
    const defaultPet: UserPet = {
      petId: 'focus-buddy',
      unlockedAt: new Date(),
      isCompanion: true,
      progress: {
        petId: 'focus-buddy',
        level: 5,
        xp: 750,
        xpToNextLevel: 1000
      }
    };

    setUserPets([defaultPet]);
    setCurrentCompanion(PETS[0]);
  }, []);

  const unlockPet = (petId: string) => {
    const pet = PETS.find(p => p.id === petId);
    if (!pet || userPets.some(up => up.petId === petId)) return;

    const newUserPet: UserPet = {
      petId,
      unlockedAt: new Date(),
      isCompanion: false,
      progress: {
        petId,
        level: 1,
        xp: 0,
        xpToNextLevel: 100
      }
    };

    setUserPets(prev => [...prev, newUserPet]);
  };

  const setAsCompanion = (petId: string) => {
    setUserPets(prev => 
      prev.map(pet => ({
        ...pet,
        isCompanion: pet.petId === petId
      }))
    );
    
    const newCompanion = PETS.find(p => p.id === petId);
    if (newCompanion) {
      setCurrentCompanion(newCompanion);
    }
  };

  const isPetUnlocked = (petId: string) => {
    return userPets.some(up => up.petId === petId);
  };

  const getPetProgress = (petId: string): PetProgress | null => {
    const userPet = userPets.find(up => up.petId === petId);
    return userPet?.progress || null;
  };

  const checkForNewPetUnlocks = (totalCycles: number, currentStreak: number, totalFocusMinutes: number, level: number) => {
    const newUnlocks: Pet[] = [];
    
    PETS.forEach(pet => {
      if (isPetUnlocked(pet.id)) return;
      
      let shouldUnlock = false;
      const req = pet.unlockRequirement;
      
      switch (req.type) {
        case 'cycles':
          shouldUnlock = totalCycles >= req.value;
          break;
        case 'streak':
          shouldUnlock = currentStreak >= req.value;
          break;
        case 'focus_time':
          shouldUnlock = totalFocusMinutes >= req.value;
          break;
        case 'level':
          shouldUnlock = level >= req.value;
          break;
      }
      
      if (shouldUnlock && Math.random() < pet.dropChance) {
        unlockPet(pet.id);
        newUnlocks.push(pet);
      }
    });
    
    return newUnlocks;
  };

  return {
    userPets,
    currentCompanion,
    unlockPet,
    setAsCompanion,
    isPetUnlocked,
    getPetProgress,
    checkForNewPetUnlocks
  };
};
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Pet, RARITY_STYLES } from '@/types/pet';
import { cn } from '@/lib/utils';

interface PetUnlockModalProps {
  pet: Pet | null;
  isOpen: boolean;
  onClose: () => void;
  onSetAsCompanion?: (petId: string) => void;
  isUnlocked?: boolean;   // thêm prop này
}

export const PetUnlockModal: React.FC<PetUnlockModalProps> = ({
  pet,
  isOpen,
  onClose,
  onSetAsCompanion,
  isUnlocked = true   // mặc định true nếu không truyền
}) => {
  if (!pet) return null;

  if (!isUnlocked) {
    // 🟢 Giao diện Locked
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl">Locked</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Lock className="w-12 h-12 mb-3" />
            <p className="text-sm">This pet is currently locked.</p>
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 🟢 Giao diện Unlocked (giữ nguyên code cũ)
  const rarityStyle = RARITY_STYLES[pet.rarity];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className={cn(
                "absolute inset-0 rounded-full animate-ping",
                pet.rarity === 'Legendary' ? 'bg-yellow-400' : 
                pet.rarity === 'Epic' ? 'bg-purple-400' : 
                pet.rarity === 'Rare' ? 'bg-blue-400' : 'bg-gray-400'
              )} />
              <div className={cn(
                "relative w-20 h-20 rounded-full border-4 flex items-center justify-center bg-background",
                rarityStyle.border
              )}>
                <img 
                  src={pet.image} 
                  alt={pet.name}
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <DialogTitle className="text-xl">New Pet Unlocked!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">{pet.name}</h3>
          <p className="text-sm text-muted-foreground px-2">{pet.description}</p>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              View Later
            </Button>
            {onSetAsCompanion && (
              <Button
                onClick={() => {
                  onSetAsCompanion(pet.id);
                  onClose();
                }}
                className="flex-1"
              >
                Set as Companion
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

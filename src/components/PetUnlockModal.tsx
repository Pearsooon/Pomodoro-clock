import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star } from 'lucide-react';
import { Pet, RARITY_STYLES } from '@/types/pet';
import { cn } from '@/lib/utils';

interface PetUnlockModalProps {
  pet: Pet | null;
  isOpen: boolean;
  onClose: () => void;
  onSetAsCompanion?: (petId: string) => void;
}

export const PetUnlockModal: React.FC<PetUnlockModalProps> = ({
  pet,
  isOpen,
  onClose,
  onSetAsCompanion
}) => {
  if (!pet) return null;

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
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <DialogTitle className="text-xl">New Pet Unlocked!</DialogTitle>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
        </DialogHeader>

        <div className="text-center space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{pet.name}</h3>
            <Badge 
              variant="secondary" 
              className={cn(rarityStyle.bg, rarityStyle.text)}
            >
              {pet.rarity}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground px-2">
            {pet.description}
          </p>

          {pet.rarity === 'Legendary' && (
            <div className="flex items-center justify-center gap-1 text-yellow-600">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Legendary Pet!</span>
              <Star className="w-4 h-4 fill-current" />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
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
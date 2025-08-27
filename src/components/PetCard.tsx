import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock } from "lucide-react";
import { Pet, PetProgress, RARITY_STYLES } from "@/types/pet";
import { cn } from "@/lib/utils";

interface PetCardProps {
  pet: Pet;
  isUnlocked: boolean;
  isCompanion: boolean;
  progress?: PetProgress | null;
  onSetAsCompanion: (petId: string) => void;
}

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  isUnlocked,
  isCompanion,
  progress,
  onSetAsCompanion,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const rarityStyle = RARITY_STYLES[pet.rarity];

  const handleCardClick = () => {
    if (isUnlocked) setIsFlipped((v) => !v);
  };

  return (
    <div className="relative w-full h-48 perspective-1000">
      <div
        className={cn(
          "relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer",
          isFlipped && "rotate-y-180"
        )}
        onClick={handleCardClick}
        role="button"
        aria-label={isFlipped ? "Show front" : "Show details"}
      >
        {/* FRONT */}
        <Card
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden border-2 p-4 flex flex-col items-center justify-center",
            rarityStyle.border,
            !isUnlocked && "opacity-50 grayscale"
          )}
        >
          {!isUnlocked && (
            <div className="absolute top-2 right-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          {isCompanion && isUnlocked && (
            <div className="absolute top-2 right-2 bg-success rounded-full p-1">
              <Check className="w-3 h-3 text-success-foreground" />
            </div>
          )}

          <div className="w-16 h-16 mb-2">
            <img
              src={pet.image}
              alt={pet.name}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          <h3 className="font-semibold text-sm text-center mb-1">{pet.name}</h3>

          {/* Rarity chỉ hiển thị ở mặt trước */}
          <Badge
            variant="secondary"
            className={cn(rarityStyle.bg, rarityStyle.text, "text-xs")}
          >
            {pet.rarity}
          </Badge>

          {progress && (
            <div className="text-xs text-muted-foreground mt-1">
              Level {progress.level}
            </div>
          )}

          {/* Hint front */}
          {isUnlocked && !isFlipped && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
              <div className="px-2 py-1 rounded-full bg-black/45 text-white text-[10px] leading-none">
                Tap for details
              </div>
            </div>
          )}
        </Card>

        {/* BACK (Details) */}
        <Card
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rotate-y-180 border-2 p-4 flex flex-col relative",
            "pb-10", // chừa đáy cho bubble
            rarityStyle.border
          )}
        >
          {/* BỎ badge rarity ở mặt sau để tránh đẩy nội dung xuống */}
          <div className="mb-2">
            <h3 className="font-semibold text-sm">{pet.name}</h3>
          </div>

          <p className="text-xs text-muted-foreground mb-3">{pet.description}</p>

          {progress && (
            <div className="text-xs text-muted-foreground mb-3">
              <div>Level {progress.level}</div>
            </div>
          )}

          <Button
            onClick={(e) => {
              e.stopPropagation(); // không lật thẻ khi bấm nút
              onSetAsCompanion(pet.id);
            }}
            variant={isCompanion ? "secondary" : "default"}
            size="sm"
            className="w-full text-xs mb-9" // đẩy nút lên trên bubble
            disabled={isCompanion}
          >
            {isCompanion ? "Current Companion" : "Set as Companion"}
          </Button>

          {/* Hint back */}
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
            <div className="px-2 py-1 rounded-full bg-black/45 text-white text-[10px] leading-none">
              Tap to back
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

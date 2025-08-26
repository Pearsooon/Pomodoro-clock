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

  const flipToBack = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isUnlocked) setIsFlipped(true);
  };
  const flipToFront = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
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

          {/* HINT: luôn hiện khi ở mặt trước */}
          {isUnlocked && !isFlipped && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2">
              <div className="px-2 py-1 rounded-full bg-black/45 text-white text-[10px] leading-none">
                Tap for details
              </div>
            </div>
          )}

          {/* Nút phụ (tùy chọn) để lật – hữu ích với người dùng không quen tap toàn thẻ */}
          <div className="absolute bottom-2 right-2">
            <Button size="xs" variant="outline" onClick={flipToBack}>
              Details
            </Button>
          </div>
        </Card>

        {/* BACK (Details) */}
        <Card
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rotate-y-180 border-2 p-4 flex flex-col",
            rarityStyle.border
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm">{pet.name}</h3>
            <Badge
              variant="secondary"
              className={cn(rarityStyle.bg, rarityStyle.text, "text-xs")}
            >
              {pet.rarity}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mb-3 flex-1">
            {pet.description}
          </p>

          {progress && (
            <div className="text-xs text-muted-foreground mb-3">
              <div>Level {progress.level}</div>
            </div>
          )}

          <div className="mt-auto grid grid-cols-2 gap-2">
            <Button
              variant={isCompanion ? "secondary" : "default"}
              size="sm"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onSetAsCompanion(pet.id);
              }}
              disabled={isCompanion}
            >
              {isCompanion ? "Current Companion" : "Set as Companion"}
            </Button>

            <Button variant="outline" size="sm" className="text-xs" onClick={flipToFront}>
              Back
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

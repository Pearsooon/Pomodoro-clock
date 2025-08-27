import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock } from "lucide-react";
import { Pet, RARITY_STYLES } from "@/types/pet";
import { cn } from "@/lib/utils";

interface PetCardProps {
  pet: Pet;
  isUnlocked: boolean;
  isCompanion: boolean;
  onSetAsCompanion: (petId: string) => void;
}

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  isUnlocked,
  isCompanion,
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
          "relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer will-change-transform",
          isFlipped && "rotate-y-180"
        )}
        onClick={handleCardClick}
      >
        {/* Front */}
        <Card
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden border-2 p-4 flex flex-col items-center justify-center",
            rarityStyle.border,
            !isUnlocked && "opacity-50 grayscale"
          )}
        >
          {!isUnlocked && (
            <div className="absolute top-2 left-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {isCompanion && isUnlocked && (
            <div className="absolute top-2 left-2 bg-success rounded-full p-1">
              <Check className="w-3 h-3 text-success-foreground" />
            </div>
          )}

          <div className="w-16 h-16 mb-2">
            <img
              src={pet.image}
              alt={pet.name}
              className="w-full h-full object-contain"
            />
          </div>

          <h3 className="font-semibold text-sm text-center mb-1">{pet.name}</h3>

          <Badge
            variant="secondary"
            className={cn(rarityStyle.bg, rarityStyle.text, "text-xs")}
          >
            {pet.rarity}
          </Badge>
        </Card>

        {/* Back (DETAIL) – không hiển thị rarity */}
        <Card
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rotate-y-180 border-2 p-4 pb-5 flex flex-col",
            rarityStyle.border
          )}
        >
          <div className="mb-2">
            <h3 className="font-semibold text-sm">{pet.name}</h3>
          </div>

          <p className="text-xs text-muted-foreground mb-3 flex-1">
            {pet.description}
          </p>

          <Button
            onClick={(e) => { e.stopPropagation(); onSetAsCompanion(pet.id); }}
            variant={isCompanion ? "secondary" : "default"}
            disabled={isCompanion}
            className={cn(
              "w-full h-11 sm:h-12 px-5 rounded-lg font-semibold",
              "text-sm sm:text-[15px] leading-none text-center",
              "whitespace-nowrap overflow-hidden", // giữ 1 dòng, không tràn
              isCompanion && "bg-secondary text-secondary-foreground"
            )}
          >
            {isCompanion ? "Current Companion" : "Set as Companion"}
          </Button>

        </Card>
      </div>
    </div>
  );
};

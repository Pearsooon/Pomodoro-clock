import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, HelpCircle, X } from "lucide-react";
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
  const [showHelpTip, setShowHelpTip] = useState(false);
  const rarityStyle = RARITY_STYLES[pet.rarity];

  const handleCardClick = () => {
    if (isUnlocked) setIsFlipped((v) => !v);
  };

  // Auto-dismiss tip sau 5s
  useEffect(() => {
    if (!showHelpTip) return;
    const t = setTimeout(() => setShowHelpTip(false), 5000);
    return () => clearTimeout(t);
  }, [showHelpTip]);

  return (
    <div className="relative w-full h-48 perspective-1000">
      {/* Nút “?” hướng dẫn (không lật thẻ khi bấm) */}
      <div className="absolute right-2 top-2 z-20">
        <button
          type="button"
          aria-label="Help: how to view details"
          onClick={(e) => { e.stopPropagation(); setShowHelpTip(true); }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-muted-foreground/40 bg-background/80 backdrop-blur hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Tip nổi giống CircularTimer – auto-dismiss 5s */}
      {showHelpTip && (
        <div
          className="
            fixed z-[60]
            right-3 top-[calc(env(safe-area-inset-top,0px)+12px)]
            w-[88vw] max-w-sm
            rounded-lg border bg-card/95 text-card-foreground
            shadow-md backdrop-blur supports-[backdrop-filter]:bg-card/80
            sm:right-6 sm:top-6 sm:w-96 sm:max-w-none sm:shadow-xl
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start p-3 sm:p-4">
            <div className="flex-1 text-sm sm:text-base">
              <b>How to view: </b>
              Tap for details and tap again to back
            </div>
            <button
              aria-label="Dismiss tip"
              onClick={() => setShowHelpTip(false)}
              className="
                ml-2 sm:ml-3 inline-flex items-center justify-center
                w-8 h-8 sm:w-9 sm:h-9 rounded-full
                opacity-100 active:scale-95 transition
                focus:outline-none focus:ring-2 focus:ring-primary
              "
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer",
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

        {/* Back (DETAIL) – bỏ hiển thị rarity theo yêu cầu */}
        <Card
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rotate-y-180 border-2 p-4 flex flex-col",
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
            onClick={(e) => {
              e.stopPropagation();
              onSetAsCompanion(pet.id);
            }}
            variant={isCompanion ? "secondary" : "default"}
            size="sm"
            className="w-full text-xs"
            disabled={isCompanion}
          >
            {isCompanion ? "Current Companion" : "Set as Companion"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

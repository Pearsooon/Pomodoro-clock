import React, { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter as FilterIcon, Lock, HelpCircle, X } from "lucide-react";
import { PetCard } from "@/components/PetCard";
import { Pet, PetRarity } from "@/types/pet";
import { PETS } from "@/data/pets";
import { usePetCollection } from "@/hooks/usePetCollection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

type ViewFilter = "all" | "owned" | "locked";
type SortMode = "none" | "rarity_asc" | "rarity_desc";

const rarityWeight: Record<PetRarity, number> = {
  Common: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
};

export const PetGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("none");

  // Tip hướng dẫn (global, không theo từng card)
  const [showHelpTip, setShowHelpTip] = useState(false);
  useEffect(() => {
    if (!showHelpTip) return;
    const t = setTimeout(() => setShowHelpTip(false), 5000);
    return () => clearTimeout(t);
  }, [showHelpTip]);

  const { userPets, isPetUnlocked, setAsCompanion } = usePetCollection();

  const filteredPets = useMemo(() => {
    let list = PETS.filter((pet) => {
      const matchesSearch =
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.description.toLowerCase().includes(searchTerm.toLowerCase());

      const owned = isPetUnlocked(pet.id);
      const matchesFilter =
        viewFilter === "all" ||
        (viewFilter === "owned" && owned) ||
        (viewFilter === "locked" && !owned);

      return matchesSearch && matchesFilter;
    });

    if (sortMode === "rarity_asc") {
      list = [...list].sort(
        (a, b) => rarityWeight[a.rarity] - rarityWeight[b.rarity]
      );
    } else if (sortMode === "rarity_desc") {
      list = [...list].sort(
        (a, b) => rarityWeight[b.rarity] - rarityWeight[a.rarity]
      );
    }

    return list;
  }, [searchTerm, viewFilter, sortMode, isPetUnlocked]);

  const getCurrentCompanion = () => {
    const companionUserPet = userPets.find((up) => up.isCompanion);
    return companionUserPet ? PETS.find((p) => p.id === companionUserPet.petId) : null;
  };

  return (
    <div className="space-y-4 relative">
      {/* Header + nút “?” góc phải */}
      <div className="relative text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Pet Gallery</h2>
        <p className="text-sm text-muted-foreground">
          Collect pets by completing Pomodoro sessions
        </p>
        {getCurrentCompanion() && (
          <div className="mt-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Current: {getCurrentCompanion()?.name}
            </Badge>
          </div>
        )}

        {/* Help button top-right (cùng dòng tiêu đề) */}
        <div className="absolute right-0 top-0">
          <button
            type="button"
            aria-label="Help: how to view details"
            onClick={() => setShowHelpTip(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground/40 bg-background/80 backdrop-blur hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tip nổi (global) – auto-dismiss 5s */}
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
        >
          <div className="flex items-start p-3 sm:p-4">
            <div className="flex-1 text-sm sm:text-base">
              <b>Tip: </b>
              Tap a pet card to flip and view details.
              <br>Use button <b>Set as Companion</b> to make it your buddy. Tap again to return.</br>
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

      {/* Search + Filter button */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FilterIcon className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Show</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={viewFilter}
              onValueChange={(v) => setViewFilter(v as ViewFilter)}
            >
              <DropdownMenuRadioItem value="all">All Pets</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="owned">Owned</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="locked">Locked</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sortMode}
              onValueChange={(v) => setSortMode(v as SortMode)}
            >
              <DropdownMenuRadioItem value="none">Default</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="rarity_asc">
                Rarity: Low → High
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="rarity_desc">
                Rarity: High → Low
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredPets.map((pet) => {
          const unlocked = isPetUnlocked(pet.id);
          const isCompanion =
            userPets.find((up) => up.petId === pet.id)?.isCompanion || false;

          if (!unlocked) {
            return (
              <Card
                key={pet.id}
                className="p-6 flex items-center justify-center h-[180px] border-dashed"
              >
                <div className="flex flex-col items-center text-muted-foreground">
                  <Lock className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Locked</span>
                </div>
              </Card>
            );
          }

          return (
            <PetCard
              key={pet.id}
              pet={pet}
              isUnlocked
              isCompanion={isCompanion}
              onSetAsCompanion={setAsCompanion}
            />
          );
        })}
      </div>

      {filteredPets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No pets found.</p>
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter as FilterIcon, Lock } from "lucide-react";
import { PetCard } from "@/components/PetCard";
import { Pet, PetRarity } from "@/types/pet";
import { PETS } from "@/data/pets";
import { usePetCollection } from "@/hooks/usePetCollection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

  const { userPets, isPetUnlocked, getPetProgress, setAsCompanion } =
    usePetCollection();

  const filteredPets = useMemo(() => {
    let list = PETS.filter((pet) => {
      // Search
      const matchesSearch =
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Ownership
      const owned = isPetUnlocked(pet.id);
      const matchesFilter =
        viewFilter === "all" ||
        (viewFilter === "owned" && owned) ||
        (viewFilter === "locked" && !owned);

      return matchesSearch && matchesFilter;
    });

    // Sort by rarity if chosen
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
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
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
      </div>

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
            <DropdownMenuItem onClick={() => setViewFilter("all")}>
              All Pets
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewFilter("owned")}>
              Owned
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewFilter("locked")}>
              Locked
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSortMode("rarity_asc")}>
              Rarity: Low → High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortMode("rarity_desc")}>
              Rarity: High → Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredPets.map((pet) => {
          const isUnlocked = isPetUnlocked(pet.id);
          const isCompanion =
            userPets.find((up) => up.petId === pet.id)?.isCompanion || false;
          const progress = getPetProgress(pet.id);

          // Nếu bị khóa: ẩn ảnh/tên/độ hiếm -> chỉ hiển thị thẻ Locked
          if (!isUnlocked) {
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
              progress={progress}
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

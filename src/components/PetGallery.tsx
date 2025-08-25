import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { PetCard } from '@/components/PetCard';
import { Pet, PetRarity } from '@/types/pet';
import { PETS } from '@/data/pets';
import { usePetCollection } from '@/hooks/usePetCollection';

type FilterType = 'all' | 'owned' | 'locked';

export const PetGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [rarityFilter, setRarityFilter] = useState<PetRarity | 'all'>('all');
  
  const { userPets, isPetUnlocked, getPetProgress, setAsCompanion } = usePetCollection();

  const filteredPets = useMemo(() => {
    return PETS.filter(pet => {
      // Search filter
      const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pet.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Ownership filter
      const isOwned = isPetUnlocked(pet.id);
      const matchesOwnership = filterType === 'all' || 
                              (filterType === 'owned' && isOwned) ||
                              (filterType === 'locked' && !isOwned);
      
      // Rarity filter
      const matchesRarity = rarityFilter === 'all' || pet.rarity === rarityFilter;
      
      return matchesSearch && matchesOwnership && matchesRarity;
    });
  }, [searchTerm, filterType, rarityFilter, isPetUnlocked]);

  const getCurrentCompanion = () => {
    const companionUserPet = userPets.find(up => up.isCompanion);
    return companionUserPet ? PETS.find(p => p.id === companionUserPet.petId) : null;
  };

  return (
    <div className="space-y-4">
      {/* Header with current companion */}
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

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {(['all', 'owned', 'locked'] as FilterType[]).map(filter => (
              <Button
                key={filter}
                variant={filterType === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(filter)}
                className="text-xs"
              >
                {filter === 'all' ? 'All' : filter === 'owned' ? 'Owned' : 'Locked'}
              </Button>
            ))}
          </div>

          <div className="flex gap-1">
            {(['all', 'Common', 'Rare', 'Epic', 'Legendary'] as const).map(rarity => (
              <Button
                key={rarity}
                variant={rarityFilter === rarity ? "default" : "outline"}
                size="sm"
                onClick={() => setRarityFilter(rarity)}
                className="text-xs"
              >
                {rarity}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Pet grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredPets.map(pet => {
          const isUnlocked = isPetUnlocked(pet.id);
          const isCompanion = userPets.find(up => up.petId === pet.id)?.isCompanion || false;
          const progress = getPetProgress(pet.id);

          return (
            <PetCard
              key={pet.id}
              pet={pet}
              isUnlocked={isUnlocked}
              isCompanion={isCompanion}
              progress={progress}
              onSetAsCompanion={setAsCompanion}
            />
          );
        })}
      </div>

      {filteredPets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No pets found matching your filters.</p>
        </div>
      )}
    </div>
  );
};
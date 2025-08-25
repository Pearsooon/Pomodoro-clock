import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Target } from 'lucide-react';
import petAwake from '@/assets/pet-awake.png';

export const PetTab: React.FC = () => {
  // Mock pet data - in a real app this would come from a store/database
  const petData = {
    level: 5,
    xp: 750,
    xpToNextLevel: 1000,
    totalCycles: 47,
    currentStreak: 8
  };

  const xpProgress = (petData.xp / petData.xpToNextLevel) * 100;

  return (
    <div className="p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Your Pet</h1>
        <p className="text-muted-foreground">Keep focusing to help your pet grow!</p>
      </div>

      {/* Pet display */}
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img
              src={petAwake}
              alt="Your pet"
              className="w-32 h-32 object-contain"
            />
            {/* Level badge */}
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {petData.level}
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-foreground mb-2">Focus Buddy</h2>
        <p className="text-muted-foreground mb-4">Level {petData.level} Pet</p>
        
        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>XP Progress</span>
            <span>{petData.xp}/{petData.xpToNextLevel}</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {petData.xpToNextLevel - petData.xp} XP until next level
          </p>
        </div>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{petData.totalCycles}</div>
              <div className="text-sm text-muted-foreground">Total Cycles</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{petData.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{Math.floor(petData.totalCycles * 25 / 60)}h</div>
              <div className="text-sm text-muted-foreground">Focus Time</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Growth tips */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Growth Tips</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            Complete Pomodoro cycles to earn XP
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            Each completed work session = 1 XP point
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            Level up unlocks new pet animations
          </div>
        </div>
      </Card>
    </div>
  );
};
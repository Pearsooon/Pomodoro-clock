// src/components/PetTab.tsx
import React from "react";
import { PetGallery } from "@/components/PetGallery";

/** Mở thẳng PetGallery, không còn màn stats/XP */
export const PetTab: React.FC = () => {
  return (
    <div className="p-6 pb-20">
      <PetGallery />
    </div>
  );
};

export default PetTab;

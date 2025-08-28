// src/data/pets.ts
import doraemon from "@/assets/Doraemon.png";
import dorami   from "@/assets/Dorami-1.png";
import nobita   from "@/assets/Nobita.png";
import shizuka  from "@/assets/Shizuka.png";
import suneo    from "@/assets/Suneo.gif";
import takeshi  from "@/assets/Takeshi_Goda.gif";
// … có thể giữ petSleeping dùng chung khi break:
import petSleeping from "@/assets/pet-sleeping.png";

export const PETS: Pet[] = [
  {
    id: "doraemon",
    name: "Doraemon",
    rarity: "Legendary",
    description: "Always ready with a gadget to keep you on task.",
    image: doraemon,
    sleepImage: petSleeping, // tùy chọn
  },
  {
    id: "dorami",
    name: "Dorami",
    rarity: "Epic",
    description: "Cheerful helper for focused sprints.",
    image: dorami,
    sleepImage: petSleeping,
  },
  {
    id: "nobita",
    name: "Nobita",
    rarity: "Common",
    description: "Gentle buddy for beginners.",
    image: nobita,
    sleepImage: petSleeping,
  },
  {
    id: "shizuka",
    name: "Shizuka",
    rarity: "Rare",
    description: "Keeps things calm and consistent.",
    image: shizuka,
    sleepImage: petSleeping,
  },
  {
    id: "suneo",
    name: "Suneo",
    rarity: "Rare",
    description: "A stylish motivator.",
    image: suneo,
    sleepImage: petSleeping,
  },
  {
    id: "takeshi",
    name: "Takeshi Goda",
    rarity: "Rare",
    description: "Power through tough sessions.",
    image: takeshi,
    sleepImage: petSleeping,
  },
  // ... các pet khác
];

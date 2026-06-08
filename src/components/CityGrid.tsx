import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  Dumbbell,
  Home,
  Landmark,
  Leaf,
  Library,
  Plus,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BuildingId } from "../types/city";
import { buildings } from "../gameData";
import { useCityStore } from "../store/cityStore";

const buildingIcons: Record<BuildingId, LucideIcon> = {
  home: Home,
  gym: Dumbbell,
  library: Library,
  office: BriefcaseBusiness,
  temple: Landmark,
  farm: Sprout,
  school: BookOpen,
  park: Leaf,
  hospital: Activity,
};

export function CityGrid() {
  const tiles = useCityStore((s) => s.tiles);
  const selectedTileId = useCityStore((s) => s.selectedTileId);
  const selectTile = useCityStore((s) => s.selectTile);

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => {
        const building = buildings.find((b) => b.id === tile.buildingId);
        const Icon = building ? buildingIcons[building.id] : Plus;
        const selected = selectedTileId === tile.id;
        return (
          <button
            className={`aspect-square rounded-lg border p-3 text-left transition ${
              selected
                ? "border-teal-700 bg-teal-50"
                : building
                  ? "border-slate-200 bg-white hover:border-teal-300"
                  : "border-dashed border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-white"
            }`}
            key={tile.id}
            onClick={() => selectTile(tile.id)}
            type="button"
          >
            <div className="flex h-full flex-col justify-between">
              <Icon className={`h-7 w-7 ${building ? "text-teal-700" : "text-slate-400"}`} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{building?.name ?? "Empty"}</p>
                <p className="truncate text-xs text-slate-500">{building?.lifeArea ?? "Build"}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

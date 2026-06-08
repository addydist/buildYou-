import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  Dumbbell,
  Hammer,
  Home,
  Landmark,
  Leaf,
  Library,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Building, BuildingId } from "../types/city";
import { buildings } from "../gameData";
import { useCityStore } from "../store/cityStore";
import { CityGrid } from "../components/CityGrid";
import { BuildingCard, PassiveLine } from "../components/BuildingCard";
import { Panel } from "../components/ui/Panel";
import { PrimaryButton } from "../components/ui/Buttons";

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

function BuildingDetail({ building }: { building: Building }) {
  const Icon = buildingIcons[building.id];
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-50 text-teal-800">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-bold">{building.name}</h3>
          <p className="text-sm text-slate-500">{building.lifeArea}</p>
        </div>
      </div>
      <p className="mb-3 text-sm text-slate-600">{building.description}</p>
      <PassiveLine building={building} />
    </div>
  );
}

export function City({ onOpenShop }: { onOpenShop: () => void }) {
  const tiles = useCityStore((s) => s.tiles);
  const selectedTileId = useCityStore((s) => s.selectedTileId);
  const selectedTile = tiles.find((t) => t.id === selectedTileId);
  const selectedBuilding = buildings.find((b) => b.id === selectedTile?.buildingId);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Panel title="City Grid">
        <CityGrid />
      </Panel>
      <Panel title="Selected Tile">
        {selectedTile ? (
          selectedBuilding ? (
            <BuildingDetail building={selectedBuilding} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                This tile is open. Add a building that represents the life area you want to strengthen next.
              </p>
              <PrimaryButton icon={Hammer} label="Open shop" onClick={onOpenShop} />
            </div>
          )
        ) : (
          <p className="text-sm text-slate-600">Select a tile to inspect it or build something new.</p>
        )}
      </Panel>
    </div>
  );
}

export function BuildingShop() {
  const resources = useCityStore((s) => s.resources);
  const tiles = useCityStore((s) => s.tiles);
  const selectedTileId = useCityStore((s) => s.selectedTileId);
  const buildOnTile = useCityStore((s) => s.buildOnTile);
  const emptyTile =
    tiles.find((t) => t.id === selectedTileId && !t.buildingId) ?? tiles.find((t) => !t.buildingId);

  return (
    <div className="space-y-4">
      <Panel title="Building Shop">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {buildings.map((building) => {
            const affordable = Object.entries(building.cost).every(
              ([key, amount]) => resources[key as keyof typeof resources] >= (amount ?? 0),
            );
            return (
              <BuildingCard
                affordable={affordable}
                building={building}
                canBuild={!!emptyTile}
                key={building.id}
                onBuild={() => emptyTile && buildOnTile(emptyTile.id, building.id)}
              />
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

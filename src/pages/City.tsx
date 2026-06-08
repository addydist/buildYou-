import { buildings } from "../gameData";
import { useCityStore } from "../store/cityStore";
import { CityGrid } from "../components/CityGrid";
import { BuildingCard } from "../components/BuildingCard";
import { Panel } from "../components/ui/Panel";

export function City({ onOpenShop }: { onOpenShop: () => void }) {
  return <CityGrid onOpenShop={onOpenShop} />;
}

export function BuildingShop() {
  const resources      = useCityStore((s) => s.resources);
  const tiles          = useCityStore((s) => s.tiles);
  const selectedTileId = useCityStore((s) => s.selectedTileId);
  const buildOnTile    = useCityStore((s) => s.buildOnTile);
  const emptyTile =
    tiles.find((t) => t.id === selectedTileId && !t.buildingId) ?? tiles.find((t) => !t.buildingId);

  return (
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
  );
}

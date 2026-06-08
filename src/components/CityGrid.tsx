import { useCallback, useEffect, useRef, useState } from "react";
import { Application, extend, useApplication, useTick } from "@pixi/react";
import { Container, Graphics, Rectangle, Text, TextStyle } from "pixi.js";
import type { FederatedPointerEvent, Ticker } from "pixi.js";
import type { BuildingId, Tile } from "../types/city";
import { buildings } from "../gameData";
import { useCityStore } from "../store/cityStore";

extend({ Container, Graphics, Text });

// ─── World layout ─────────────────────────────────────────────────────────────
const TILE  = 148;
const ROAD  = 34;
const COLS  = 4;
const ROWS  = 4;

const WORLD_W = COLS * TILE + (COLS + 1) * ROAD;
const WORLD_H = ROWS * TILE + (ROWS + 1) * ROAD;

const tileX = (col: number) => ROAD + col * (TILE + ROAD);
const tileY = (row: number) => ROAD + row * (TILE + ROAD);

function findTileAt(wx: number, wy: number): number | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tx = tileX(c);
      const ty = tileY(r);
      if (wx >= tx && wx <= tx + TILE && wy >= ty && wy <= ty + TILE) {
        return r * COLS + c;
      }
    }
  }
  return null;
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C_ASPHALT  = 0x334155;
const C_SIDEWALK = 0x475569;
const C_DASH     = 0xE2E8F0;
const C_VOID     = 0x1E293B;

const TILE_BG: Record<BuildingId, number> = {
  home:     0xFFFBEB,
  gym:      0xECFDF5,
  library:  0xEFF6FF,
  office:   0xF8FAFC,
  temple:   0xFAF5FF,
  farm:     0xF0FDF4,
  school:   0xFEFCE8,
  park:     0xECFDF5,
  hospital: 0xFFF1F2,
};

const TILE_ACCENT: Record<BuildingId, number> = {
  home:     0xF59E0B,
  gym:      0x10B981,
  library:  0x3B82F6,
  office:   0x6366F1,
  temple:   0x8B5CF6,
  farm:     0x22C55E,
  school:   0xEAB308,
  park:     0x16A34A,
  hospital: 0xEF4444,
};

const EMOJI: Record<BuildingId, string> = {
  home:     "🏠",
  gym:      "🏋",
  library:  "📚",
  office:   "🏢",
  temple:   "⛩",
  farm:     "🌾",
  school:   "🏫",
  park:     "🌳",
  hospital: "🏥",
};

// ─── Shared TextStyle objects ─────────────────────────────────────────────────
const T_EMOJI = new TextStyle({
  fontSize: 54,
  fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif',
});
const T_EMOJI_GHOST = new TextStyle({
  fontSize: 64,
  fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif',
});
const T_NAME = new TextStyle({
  fontSize: 13,
  fontFamily: "system-ui,-apple-system,sans-serif",
  fill: "#0F172A",
  fontWeight: "bold",
  letterSpacing: 0.4,
});
const T_AREA = new TextStyle({
  fontSize: 10,
  fontFamily: "system-ui,-apple-system,sans-serif",
  fill: "#64748B",
  fontWeight: "500",
});
const T_PLUS = new TextStyle({
  fontSize: 40,
  fontFamily: "system-ui,sans-serif",
  fill: "#CBD5E1",
  fontWeight: "300",
});

// ─── Module-level mutable state ───────────────────────────────────────────────
const _vp:          { current: Container | null }        = { current: null };
const _app:         { current: any | null }              = { current: null };
const _cancelClick: { current: boolean }                 = { current: false };
const _ghostCon:    { current: Container | null }        = { current: null };
const _onOpenShop:  { current: (() => void) | null }     = { current: null };

// Building drag state (plain object, mutated directly for perf)
const _bDrag = {
  active: false,
  fromTileId: -1,
  buildingId: null as BuildingId | null,
  startX: 0,
  startY: 0,
  dragging: false,
};

// ─── TileSprite ───────────────────────────────────────────────────────────────
type TileProps = {
  tile: Tile;
  col: number;
  row: number;
  isSelected: boolean;
  onSelect: () => void;
};

function TileSprite({ tile, col, row, isSelected, onSelect }: TileProps) {
  const containerRef = useRef<Container>(null);
  const bgRef        = useRef<Graphics>(null);
  const scaleRef     = useRef(1);
  const animRef      = useRef(false);
  const prevIdRef    = useRef(tile.buildingId);

  // Scale-pop on new build
  useEffect(() => {
    if (tile.buildingId && !prevIdRef.current) {
      scaleRef.current = 0.08;
      animRef.current  = true;
    }
    prevIdRef.current = tile.buildingId;
  }, [tile.buildingId]);

  const onTick = useCallback((ticker: Ticker) => {
    if (!animRef.current || !containerRef.current) return;
    scaleRef.current = Math.min(1, scaleRef.current + ticker.deltaTime * 0.18);
    containerRef.current.scale.set(scaleRef.current);
    if (scaleRef.current >= 1) { animRef.current = false; containerRef.current.scale.set(1); }
  }, []);
  useTick(onTick);

  const onOver = useCallback(() => { if (bgRef.current) bgRef.current.alpha = 0.78; }, []);
  const onOut  = useCallback(() => { if (bgRef.current) bgRef.current.alpha = 1;    }, []);

  const handleClick = useCallback(() => {
    if (_cancelClick.current || _bDrag.dragging) return;
    onSelect(); // always select so shop knows which tile
    if (!tile.buildingId) _onOpenShop.current?.();
  }, [onSelect, tile.buildingId]);

  // Pointer down on a building tile → start building drag, stop world-pan
  const handlePointerDown = useCallback((e: FederatedPointerEvent) => {
    if (!tile.buildingId) return;
    e.stopPropagation();
    _bDrag.active     = true;
    _bDrag.fromTileId = tile.id;
    _bDrag.buildingId = tile.buildingId;
    _bDrag.startX     = e.globalX;
    _bDrag.startY     = e.globalY;
    _bDrag.dragging   = false;
    if (_ghostCon.current) {
      const txt = _ghostCon.current.children[0] as Text | undefined;
      if (txt) txt.text = EMOJI[tile.buildingId];
      _ghostCon.current.x       = e.globalX;
      _ghostCon.current.y       = e.globalY;
      _ghostCon.current.visible = false;
    }
  }, [tile.buildingId, tile.id]);

  const building = tile.buildingId ? (buildings.find((b) => b.id === tile.buildingId) ?? null) : null;

  const drawBg = useCallback(
    (g: Graphics) => {
      g.clear();
      if (isSelected) {
        g.roundRect(-6, -6, TILE + 12, TILE + 12, 16);
        g.fill({ color: 0x0D9488 });
        g.roundRect(-3, -3, TILE + 6, TILE + 6, 13);
        g.fill({ color: 0x99F6E4, alpha: 0.55 });
      }
      g.roundRect(0, 0, TILE, TILE, 10);
      g.fill({ color: building ? TILE_BG[building.id] : 0xF1F5F9 });
      if (!building) {
        g.roundRect(1, 1, TILE - 2, TILE - 2, 9);
        g.stroke({ color: 0xCBD5E1, width: 2, alignment: 0 });
      } else {
        g.roundRect(0, 0, TILE, 8, 10);
        g.fill({ color: 0x000000, alpha: 0.04 });
        g.roundRect(14, TILE - 17, TILE - 28, 9, 5);
        g.fill({ color: TILE_ACCENT[building.id] });
      }
    },
    [building?.id, isSelected],
  );

  const x = tileX(col);
  const y = tileY(row);

  return (
    <pixiContainer
      ref={containerRef}
      x={x + TILE / 2}
      y={y + TILE / 2}
      pivot={{ x: TILE / 2, y: TILE / 2 }}
    >
      <pixiGraphics
        ref={bgRef}
        draw={drawBg}
        eventMode="static"
        cursor={building ? "grab" : "pointer"}
        onclick={handleClick}
        onpointerdown={handlePointerDown}
        onpointerover={onOver}
        onpointerout={onOut}
      />
      {building ? (
        <>
          <pixiText text={EMOJI[building.id]} x={TILE / 2} y={TILE / 2 - 20} anchor={0.5} style={T_EMOJI} eventMode="none" />
          <pixiText text={building.name}      x={TILE / 2} y={TILE - 38}      anchor={0.5} style={T_NAME}  eventMode="none" />
          <pixiText text={building.lifeArea}  x={TILE / 2} y={TILE - 24}      anchor={0.5} style={T_AREA}  eventMode="none" />
        </>
      ) : (
        <pixiText text="+" x={TILE / 2} y={TILE / 2 - 2} anchor={0.5} style={T_PLUS} eventMode="none" />
      )}
    </pixiContainer>
  );
}

// ─── CityScene ────────────────────────────────────────────────────────────────
function CityScene() {
  const { app } = useApplication();
  const vpContainerRef = useRef<Container>(null);
  const isDragging     = useRef(false);
  const lastPtr        = useRef({ x: 0, y: 0 });

  const rawTiles       = useCityStore((s) => s.tiles);
  const selectedTileId = useCityStore((s) => s.selectedTileId);
  const selectTile     = useCityStore((s) => s.selectTile);
  const moveTile       = useCityStore((s) => s.moveTile);

  const tiles: Tile[] = Array.from({ length: COLS * ROWS }, (_, i) => {
    const stored = rawTiles.find((t) => t.id === i);
    return stored ?? { id: i, buildingId: null };
  });

  useEffect(() => {
    _vp.current  = vpContainerRef.current;
    _app.current = app ?? null;
  });

  // Centre world on mount
  useEffect(() => {
    if (!vpContainerRef.current || !app) return;
    vpContainerRef.current.x = (app.screen.width  - WORLD_W) / 2;
    vpContainerRef.current.y = (app.screen.height - WORLD_H) / 2;
  }, [app]);

  // Stage events: world pan + building drop
  useEffect(() => {
    if (!app) return;
    const stage  = app.stage;
    const canvas = app.canvas as HTMLCanvasElement;

    stage.eventMode = "static";
    stage.hitArea   = new Rectangle(-5000, -5000, 15000, 15000);
    canvas.style.cursor = "grab";

    const onDown = (_e: FederatedPointerEvent) => {
      if (_bDrag.active) return;
      isDragging.current   = true;
      _cancelClick.current = false;
      lastPtr.current      = { x: _e.globalX, y: _e.globalY };
      canvas.style.cursor  = "grabbing";
    };

    const onMove = (e: FederatedPointerEvent) => {
      if (_bDrag.active) {
        const dist = Math.hypot(e.globalX - _bDrag.startX, e.globalY - _bDrag.startY);
        if (!_bDrag.dragging && dist > 8) {
          _bDrag.dragging      = true;
          _cancelClick.current = true;
          if (_ghostCon.current) _ghostCon.current.visible = true;
        }
        if (_bDrag.dragging && _ghostCon.current) {
          _ghostCon.current.x = e.globalX;
          _ghostCon.current.y = e.globalY;
        }
        return;
      }
      if (!isDragging.current || !vpContainerRef.current) return;
      const dx = e.globalX - lastPtr.current.x;
      const dy = e.globalY - lastPtr.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) _cancelClick.current = true;
      vpContainerRef.current.x += dx;
      vpContainerRef.current.y += dy;
      lastPtr.current = { x: e.globalX, y: e.globalY };
    };

    const onUp = (e: FederatedPointerEvent) => {
      if (_bDrag.active) {
        if (_bDrag.dragging && vpContainerRef.current) {
          const vp = vpContainerRef.current;
          const wx = (e.globalX - vp.x) / vp.scale.x;
          const wy = (e.globalY - vp.y) / vp.scale.y;
          const tid = findTileAt(wx, wy);
          if (tid !== null && tid !== _bDrag.fromTileId) moveTile(_bDrag.fromTileId, tid);
        }
        if (_ghostCon.current) _ghostCon.current.visible = false;
        _bDrag.active = false; _bDrag.dragging = false;
        _bDrag.fromTileId = -1; _bDrag.buildingId = null;
        setTimeout(() => { _cancelClick.current = false; }, 100);
        return;
      }
      isDragging.current  = false;
      canvas.style.cursor = "grab";
      setTimeout(() => { _cancelClick.current = false; }, 50);
    };

    stage.on("pointerdown",      onDown);
    stage.on("pointermove",      onMove);
    stage.on("pointerup",        onUp);
    stage.on("pointerupoutside", onUp);
    return () => {
      stage.off("pointerdown",      onDown);
      stage.off("pointermove",      onMove);
      stage.off("pointerup",        onUp);
      stage.off("pointerupoutside", onUp);
    };
  }, [app, moveTile]);

  // Scroll to zoom toward cursor
  useEffect(() => {
    if (!app) return;
    const canvas = app.canvas as HTMLCanvasElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!vpContainerRef.current) return;
      const vp     = vpContainerRef.current;
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      const next   = Math.max(0.3, Math.min(3, vp.scale.x * factor));
      const rect   = canvas.getBoundingClientRect();
      const mx     = e.clientX - rect.left;
      const my     = e.clientY - rect.top;
      const wx     = (mx - vp.x) / vp.scale.x;
      const wy     = (my - vp.y) / vp.scale.y;
      vp.scale.set(next);
      vp.x = mx - wx * next;
      vp.y = my - wy * next;
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [app]);

  const drawWorld = useCallback((g: Graphics) => {
    g.clear();
    g.rect(-4000, -4000, WORLD_W + 8000, WORLD_H + 8000);
    g.fill({ color: C_VOID });
    g.rect(0, 0, WORLD_W, WORLD_H);
    g.fill({ color: C_ASPHALT });
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        g.roundRect(tileX(c) - 5, tileY(r) - 5, TILE + 10, TILE + 10, 14);
        g.fill({ color: C_SIDEWALK });
      }
    }
    for (let row = 0; row <= ROWS; row++) {
      const cy = row * (TILE + ROAD) + ROAD / 2;
      for (let dx = 14; dx < WORLD_W - 14; dx += 28) {
        g.rect(dx, cy - 2, 15, 4);
        g.fill({ color: C_DASH, alpha: 0.28 });
      }
    }
    for (let col = 0; col <= COLS; col++) {
      const cx = col * (TILE + ROAD) + ROAD / 2;
      for (let dy = 14; dy < WORLD_H - 14; dy += 28) {
        g.rect(cx - 2, dy, 4, 15);
        g.fill({ color: C_DASH, alpha: 0.28 });
      }
    }
    for (let row = 0; row <= ROWS; row++) {
      for (let col = 0; col <= COLS; col++) {
        const ix = col * (TILE + ROAD) + ROAD / 2;
        const iy = row * (TILE + ROAD) + ROAD / 2;
        g.rect(ix - 2, iy + 4, 4, 9); g.fill({ color: 0x78350F });
        g.circle(ix, iy + 2, 10);     g.fill({ color: 0x166534 });
        g.circle(ix - 3, iy - 2, 6);  g.fill({ color: 0x4ADE80, alpha: 0.9 });
      }
    }
  }, []);

  return (
    <>
      <pixiContainer ref={vpContainerRef}>
        <pixiGraphics draw={drawWorld} />
        {tiles.map((tile) => (
          <TileSprite
            key={tile.id}
            tile={tile}
            col={tile.id % COLS}
            row={Math.floor(tile.id / COLS)}
            isSelected={selectedTileId === tile.id}
            onSelect={() => selectTile(tile.id)}
          />
        ))}
      </pixiContainer>

      {/* Ghost — screen-space sibling of vpContainer */}
      <pixiContainer ref={(c) => { _ghostCon.current = c; }} visible={false} zIndex={999}>
        <pixiText text="🏠" anchor={0.5} style={T_EMOJI_GHOST} alpha={0.75} />
      </pixiContainer>
    </>
  );
}

// ─── Viewport controls ────────────────────────────────────────────────────────
function resetView() {
  const vp = _vp.current; const app = _app.current;
  if (!vp || !app) return;
  vp.scale.set(1);
  vp.x = (app.screen.width  - WORLD_W) / 2;
  vp.y = (app.screen.height - WORLD_H) / 2;
}
function zoomToCenter(factor: number) {
  const vp = _vp.current; const app = _app.current;
  if (!vp || !app) return;
  const next = Math.max(0.3, Math.min(3, vp.scale.x * factor));
  const cx = app.screen.width / 2; const cy = app.screen.height / 2;
  const wx = (cx - vp.x) / vp.scale.x; const wy = (cy - vp.y) / vp.scale.y;
  vp.scale.set(next);
  vp.x = cx - wx * next;
  vp.y = cy - wy * next;
}

// ─── CityGrid public export ───────────────────────────────────────────────────
export function CityGrid({ onOpenShop }: { onOpenShop?: () => void }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Keep module-level callback in sync with prop
  useEffect(() => { _onOpenShop.current = onOpenShop ?? null; }, [onOpenShop]);

  return (
    <div className="relative w-full" style={{ height: "72vh", minHeight: 460 }}>
      {/* Canvas: absolute inset-0 so it fills the outer div */}
      <div ref={setContainer} className="absolute inset-0 overflow-hidden rounded-xl">
        {container && (
          <Application
            resizeTo={container}
            background={C_VOID}
            antialias
            autoDensity
            resolution={typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1}
          >
            <CityScene />
          </Application>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1.5">
        {(
          [
            { label: "+", title: "Zoom in",    fn: () => zoomToCenter(1.2)  },
            { label: "−", title: "Zoom out",   fn: () => zoomToCenter(0.83) },
            { label: "⊙", title: "Reset view", fn: resetView                },
          ] as const
        ).map(({ label, title, fn }) => (
          <button
            key={title}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-lg font-bold text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-700/90"
            onClick={fn}
            title={title}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
        <span className="rounded-full bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 shadow backdrop-blur-sm">
          Click + to open shop · Hold building to drag it · Scroll to zoom
        </span>
      </div>
    </div>
  );
}

# Addy City

Addy City is a productivity RPG MVP where completing real tasks grows a future-self city. Tasks reward resources, buildings represent life areas, streaks multiply rewards, and rare monuments create a collection loop.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## MVP Includes

- Dashboard with population, resources, streak, stage, daily passive rewards, and today's progress.
- Task creation with difficulty, category, estimated time, and reward previews.
- Category rewards that make task choice meaningful:
  - Study gives Knowledge.
  - Work gives Gold.
  - Fitness gives Energy.
  - Reading gives Wisdom.
- City grid with buildable empty tiles.
- Building shop with costs, passive rewards, and future-self life areas.
- Streak multipliers:
  - 1 day: x1
  - 7 days: x1.5
  - 30 days: x2
- Missed-day behavior where growth is paused until a task is completed.
- Rare drops from task completion:
  - Golden Statue: 1%
  - Wonder of the World: 0.5%
  - Dragon Monument: 0.1%
- Local save data through Zustand persistence.

## Suggested Next Steps

1. Add authentication and a backend save API.
2. Add PostgreSQL tables for users, tasks, resources, tiles, buildings, and rewards.
3. Add task recurrence and daily reset logic on the backend.
4. Add richer building upgrades and unlocks by stage.
5. Add simple animations for task completion, building placement, and rare drops.
6. Later, replace the React grid with Phaser or an isometric city view.

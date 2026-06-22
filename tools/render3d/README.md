# render3d — headless 3D screenshots of generated worlds

Real three.js WebGL renders of `vaylord-world-creator` worlds **without a GPU or a
browser**, so verification screenshots can be attached to workspace issues from a
browserless session.

## How it works
- `gl` (headless-gl) provides a software WebGL context.
- It runs under `Xvfb` (a virtual X display) — headless-gl's GLX backend needs a
  display even for software (mesa `llvmpipe`) rendering.
- `three` is pinned to **r149** because headless-gl is WebGL **1.0**, and three
  `>= r163` requires WebGL2.
- It draws the actual generated terrain: a height mesh with per-vertex biome
  colours, roads darkened from `world.roadField`, water plane, and lighting.

## Prerequisites
- A `vaylord-world-creator` checkout as a **sibling** of this `vaylord-workspace`
  clone (the default session layout). The source is bundled at build time from
  `../../../vaylord-world-creator/src/core/*`.
- `Xvfb` available on the host (`xvfb-run`). On Debian/Ubuntu: `apt-get install -y xvfb`.

## Usage
```sh
cd tools/render3d
npm install
npm run render -- 42 7 99      # one PNG per seed → out/scene3d_<seed>.png
```

Then host the PNGs in this (public) repo and embed them in the issue via a
`raw.githubusercontent.com/<owner>/vaylord-workspace/<commit-sha>/...` URL so they
render inline (use a commit SHA, not the branch, since branch names contain `/`).

## Caveats
- This is a simplified material (vertex-colour biome + lighting), not the full
  in-app shader (no material textures/decals), and renders at grid 512 — so
  slope-based beach classification can look a bit heavier than in-app (4096).
  Use it to check shape/coastline/road-on-terrain, not final art.

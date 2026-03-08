# Bit Holder Generator

A client-side parametric 3D screw bit holder generator. Configure bit layouts, types, and labels — then preview and download `.stl` files. Everything runs in the browser, no server needed.

**Live at**: https://L0laapk3.github.io/3d_bit_gen/

Fully vibecoded.

## Features

- 🔧 **25+ bit types** across 5 categories (Standard, Torx, Hex, Specialty, Drill)
- 📐 **Parametric design** — configurable hex width, depth, padding, labels
- 🔄 **Single or double row** modes with automatic centering
- 🖼️ **Live 3D preview** with orbit controls (Three.js)
- 💾 **STL export** for 3D printing
- 🎨 **Light / Dark / System theme** toggle
- ⚙️ **Multiple configurations** with localStorage persistence
- 💾 **Local persistence** — settings saved automatically via `localStorage`

## Tech Stack

| Component | Library |
|---|---|
| 3D Modeling | `@jscad/modeling` |
| STL Export | `@jscad/stl-serializer` |
| 3D Preview | Three.js |
| Hosting | GitHub Pages (static) |

No build step — just HTML, CSS, and ES modules loaded from CDN.

## Local Development

```bash
# Any static server works:
pnpx http-server

# Then open http://localhost:8080
```
# Bit Holder Generator

A client-side parametric 3D screw bit holder generator. Configure bit layouts, types, and labels — then preview and download `.stl` files. Everything runs in the browser, no server needed.

**Live at**: `https://L0laapk3.github.io/3d_bit_holder/`

## Features

- 🔧 **25+ bit types** across 5 categories (Standard, Torx, Hex, Specialty, Drill)
- 📐 **Parametric design** — configurable hex width, depth, spacing, labels
- 🔄 **Single or double row** modes with automatic centering
- 🖼️ **Live 3D preview** with orbit controls (Three.js)
- 💾 **STL export** for 3D printing
- 🎨 **Light / Dark / System theme** toggle
- ⚙️ **Multiple configurations** with localStorage persistence

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
npx http-server -p 8080

# Then open http://localhost:8080
```

## Deploying to GitHub Pages

1. Go to your repo **Settings → Pages**
2. Set source to **Deploy from a branch**
3. Select the `main` branch, root folder
4. Save — your site will be live at `https://<username>.github.io/3d_bit_holder/`

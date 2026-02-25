# roki-three

## Open Sample Animation Viewer

GitHub Pages (sample animation viewer): https://n-wakisaka.github.io/roki-three/

## Getting Started

```bash
pnpm install
pnpm build
```

## Running the tests

```bash
pnpm test
```

## Running the example locally

### Run server

Node

```bash
http-server
```

Python

```bash
python -m http.server 8080
```

Docker

```bash
docker-compose up
```

### Open fixed sample example

http://localhost:8080/example/arm/

### Open GitHub Pages viewer (upload your own ztk/zvs)

http://localhost:8080/pages/

## GitHub Pages deployment

The workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys `pages/` and `dist/` to GitHub Pages when `main` is updated.

1. Open repository settings and enable GitHub Pages with source `GitHub Actions`.
2. Push to `main` (or run workflow manually).
3. Access the viewer at `https://<your-account>.github.io/<your-repo>/`.

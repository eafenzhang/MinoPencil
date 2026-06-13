# MinoPencil 🐰

> AI-native vector prototyping design tool — Forked from [OpenPencil](https://github.com/ZSeven-W/openpencil).

MinoPencil is a desktop vector design tool that combines professional-grade editing capabilities with built-in AI assistance. It detects your local Agent CLI tools (claude, codex, gemini), helps you configure a Provider, and lets you generate and modify designs through an embedded chat panel — no external CLI or DSL needed.

## Features

- **Full vector design tool** — Toolbar, property panel, layers, selection editing (Figma-level)
- **AI-assisted prototyping** — Built-in chat panel, describe what you want, see it rendered on canvas
- **Streaming generation** — AI output renders incrementally, no waiting for full completion
- **Local CLI detection** — Automatically detects installed Agent CLIs and suggests Provider configs
- **Multiple AI providers** — OpenAI-compatible API, configure your own Provider
- **Export** — HTML+CSS, React+Tailwind, .op file format

## Quick Start

```bash
npm install
npm run dev
```

For the desktop Electron version:

```bash
npm run electron:dev
```

## Project Structure

```
packages/
  pen-types/        — Core data types
  pen-core/         — Document operations & layout engine
  pen-engine/       — Design engine & canvas interaction
  pen-renderer/     — Rendering layer (DOM + CanvasKit)
  pen-react/        — React components (toolbar, panels, canvas)
  pen-ai-skills/    — AI skill system
  pen-mcp/          — MCP tools (simplified)
  pen-sdk/          — SDK export layer
  pen-provider/     — CLI detection + Provider management (NEW)
  pen-chat/         — AI chat panel (NEW)
apps/
  desktop/          — Electron desktop app
  web/              — Web build (Vite + Nitro server)
```

## License

MIT — see [LICENSE](LICENSE).  
OpenPencil is (c) 2026 ZSeven-W. MinoPencil is a fork maintained by contributors.

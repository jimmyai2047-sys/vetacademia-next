// Static asset loaders for server-side PDF generation.
//
// VERCEL BUILD WARNING FIX — read this before touching this file:
// Vercel's file tracer (@vercel/nft) only understands fs calls whose path is
// built inline from string literals, e.g.
//   fs.readFileSync(path.join(process.cwd(), "public", "fonts", "x.ttf"))
// If a path flows through an array, a loop variable, a function parameter, or
// a Record lookup (e.g. `candidates[i]` or `MAP[key]`), nft cannot resolve it
// and falls back to "tracing of the whole project", which bloats/slows the
// serverless function build ("Dynamic filesystem access causes tracing of
// the whole project").
//
// RULES for this file:
// 1. Every fs.readFileSync call MUST inline path.join(process.cwd(), ...)
//    with ONLY string-literal segments. No variables in the segment list.
// 2. Do NOT refactor the branches below into loops, arrays, or a generic
//    read-helper that takes a filename — that reintroduces dynamic access.
// 3. To add a new asset, add a new branch/function following the same shape.
//
// Behavior: each loader returns the file bytes, or null when the file is
// missing/unreadable. Callers fall back to Helvetica / drawn sketches.
import * as fs from "fs";
import * as path from "path";

export function loadDevanagariRegular(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Regular.ttf"));
  } catch {
    return null;
  }
}

export function loadDevanagariBold(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Bold.ttf"));
  } catch {
    return null;
  }
}

export function loadReportLogo(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "logo-vetacademia.png"));
  } catch {
    return null;
  }
}

export type ReportSketchName =
  | "buffalo"
  | "cattle"
  | "goat"
  | "pig"
  | "poultry_broiler"
  | "poultry_layer"
  | "processing"
  | "sheep"
  | "sheep_goat";

export function loadReportSketch(name: ReportSketchName): Buffer | null {
  try {
    if (name === "buffalo") {
      return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "buffalo.png"));
    }
    if (name === "cattle") {
      return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "cattle.png"));
    }
    if (name === "goat") {
      return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "goat.png"));
    }
    if (name === "pig") {
      return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "pig.png"));
    }
    if (name === "poultry_broiler") {
      return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "poultry_broiler.png"));
    }
    if (name === "poultry_layer") {
      return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "poultry_layer.png"));
    }
    if (name === "processing") {
      return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "processing.png"));
    }
    if (name === "sheep") {
      return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "sheep.png"));
    }
    return fs.readFileSync(path.join(process.cwd(), "assets", "sketches", "sheep_goat.png"));
  } catch {
    return null;
  }
}

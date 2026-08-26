/**
 * Where runs go.
 *
 * Default: a JSONL file per run under runs/. No database, no signup, works the
 * moment you clone. Append-only, so history is never overwritten.
 *
 * When you outgrow it: implement the same two methods against Supabase and swap
 * the export at the bottom. The rest of the harness does not change — that is
 * the whole reason this file exists. See docs/02-evaluation.md for the schema.
 */

import { appendFile, mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { RunRow } from "./types.ts";

export interface Store {
  append(rows: RunRow[]): Promise<string>;
  loadAll(): Promise<RunRow[]>;
}

export class FileStore implements Store {
  // Written out longhand rather than as a constructor parameter property:
  // Node's strip-only TypeScript mode rejects those (it erases types, it does
  // not compile). Same reason there are no enums or namespaces in this harness.
  dir: string;

  constructor(dir = "runs") {
    this.dir = dir;
  }

  async append(rows: RunRow[]): Promise<string> {
    await mkdir(this.dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = join(this.dir, `${stamp}.jsonl`);
    await appendFile(path, rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
    return path;
  }

  async loadAll(): Promise<RunRow[]> {
    try {
      const files = (await readdir(this.dir)).filter((f) => f.endsWith(".jsonl"));
      const out: RunRow[] = [];
      for (const f of files.sort()) {
        const text = await readFile(join(this.dir, f), "utf8");
        for (const line of text.split("\n")) {
          if (line.trim()) out.push(JSON.parse(line) as RunRow);
        }
      }
      return out;
    } catch {
      return [];
    }
  }
}

export const store: Store = new FileStore();

import type { Project } from "./types";
import { allFiles, buildConfig, pathOf, readyAssets } from "./assets";
import { ensureLoaded } from "./images";
import { sdkById } from "./sdk";
import { slug } from "./util";
import { zip } from "./zip";

export interface ZipOptions {
  readme: boolean;
  fullConfig: boolean;
}

const toBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((res, rej) =>
    c.toBlob(
      (b) => (b ? res(b) : rej(new Error("Canvas export failed"))),
      "image/png",
    ),
  );
const images = (s: Project) => [
  s.icon.image,
  s.adaptive.fg.image,
  s.adaptive.bgImage,
  s.adaptive.mono.image,
  s.splash.image,
];

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function fileBlob(
  s: Project,
  id: string,
): Promise<{ blob: Blob; name: string }> {
  await ensureLoaded(images(s));
  const f = allFiles(s).find((x) => x.id === id);
  if (!f) throw new Error("File is not part of the current export.");
  return { blob: await toBlob(f.render()), name: f.name };
}

export const readme = (s: Project) => {
  const lines = allFiles(s).map(
    (f) =>
      `- \`${pathOf(s, f).replace(/^\.\//, "")}\` — ${f.w}×${f.h} ${f.format}. ${f.note}`,
  );
  return `# ${s.project.name} — Expo assets

Generated with Expo Asset Studio for **Expo SDK ${s.project.sdk}**.

## Files

${lines.join("\n")}

## How to use

1. Copy the \`assets/\` folder into the root of your Expo project (existing files at the same paths are overwritten).
2. Merge \`expo-config.fragment.json\` into the \`expo\` section of your \`app.json\` / \`app.config.json\`.
3. Run \`npx expo prebuild --clean\` (or rebuild your dev client) so native projects pick up the new assets.

> The configuration rules for SDK ${s.project.sdk} are bundled with the app and have not been verified against Expo's published schema. Check them against the Expo docs before shipping.
`;
};

export async function buildZip(
  s: Project,
  o: ZipOptions,
): Promise<{ blob: Blob; count: number; name: string }> {
  await ensureLoaded(images(s));
  const enc = new TextEncoder();
  const entries: { path: string; data: Uint8Array }[] = [];
  for (const f of allFiles(s)) {
    const b = await toBlob(f.render());
    entries.push({
      path: pathOf(s, f).replace(/^\.\//, ""),
      data: new Uint8Array(await b.arrayBuffer()),
    });
  }
  entries.push({
    path: "expo-config.fragment.json",
    data: enc.encode(
      JSON.stringify(buildConfig(s, "fragment"), null, 2) + "\n",
    ),
  });
  if (o.fullConfig)
    entries.push({
      path: "app.json",
      data: enc.encode(
        JSON.stringify(buildConfig(s, "complete"), null, 2) + "\n",
      ),
    });
  if (o.readme)
    entries.push({ path: "README.md", data: enc.encode(readme(s)) });
  return {
    blob: zip(entries),
    count: entries.length,
    name: `${slug(s.project.name)}-expo-sdk${sdkById(s.project.sdk).id}-assets.zip`,
  };
}

export const zipTree = (s: Project, o: ZipOptions) => {
  const rows: { path: string; kind: "asset" | "config" | "doc" }[] = allFiles(
    s,
  ).map((f) => ({
    path: pathOf(s, f).replace(/^\.\//, ""),
    kind: "asset" as const,
  }));
  rows.push({ path: "expo-config.fragment.json", kind: "config" });
  if (o.fullConfig) rows.push({ path: "app.json", kind: "config" });
  if (o.readme) rows.push({ path: "README.md", kind: "doc" });
  return rows;
};

export const hasExportable = (s: Project) => readyAssets(s).length > 0;

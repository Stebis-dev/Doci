import { cp, mkdir } from "fs/promises";

const wasmFiles = [
    {
        src: "node_modules/tree-sitter-javascript/tree-sitter-javascript.wasm",
        destName: "tree-sitter-javascript.wasm",
    },
    {
        src: "node_modules/tree-sitter-typescript/tree-sitter-typescript.wasm",
        destName: "tree-sitter-typescript.wasm",
    },
    {
        // TSX grammar wasm shipped by tree-sitter-typescript
        src: "node_modules/tree-sitter-typescript/tree-sitter-tsx.wasm",
        destName: "tree-sitter-tsx.wasm",
    },
];


const platform = process.argv[2] || "win";

const platformMap: Record<string, string> = {
    win: "release/win/wasm",
    mac: "release/mac/wasm",
    linux: "release/linux/wasm",
};

const targetDir = platformMap[platform];

if (!targetDir) {
    console.error(`Unknown platform: ${platform}. Use: win, mac, or linux`);
    process.exit(1);
}

await mkdir(targetDir, { recursive: true });

await cp(
    "node_modules/web-tree-sitter/tree-sitter.wasm",
    `${targetDir}/tree-sitter.wasm`
);
console.log(`\n[WASM] tree-sitter.wasm copied to ${targetDir} for platform: ${platform}`);

const copyPromises = wasmFiles.map(({ src, destName }) =>
    cp(src, `${targetDir}/${destName}`).then(() =>
        console.log(`[WASM] ${destName} copied from ${src} to ${targetDir}`)
    )
);

await Promise.all(copyPromises);

console.log(`[WASM] finished files copy to ${targetDir} for platform: ${platform}`);

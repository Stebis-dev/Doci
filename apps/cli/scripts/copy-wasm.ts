import { cp } from "fs/promises";

const platform = process.argv[2] || "win";

const platformMap: Record<string, string> = {
    win: "release/win/wasm",
    mac: "release/macos/wasm",
    linux: "release/linux/wasm",
};

const targetDir = platformMap[platform];

if (!targetDir) {
    console.error(`Unknown platform: ${platform}. Use: win, mac, or linux`);
    process.exit(1);
}

await cp(
    "node_modules/web-tree-sitter/tree-sitter.wasm",
    `${targetDir}/tree-sitter.wasm`
);
console.log(`\n[WASM] tree-sitter.wasm copied to ${targetDir} for platform: ${platform}`);

const wasmList = ['tree-sitter-javascript', 'tree-sitter-typescript']

const copyPromises = wasmList.map((wasm) =>
    cp(
        `node_modules/${wasm}/${wasm}.wasm`,
        `${targetDir}/${wasm}.wasm`
    ).then(() => console.log(`[WASM] ${wasm}.wasm copied to ${targetDir}`))
);

await Promise.all(copyPromises);

console.log(`[WASM] finished files copy to ${targetDir} for platform: ${platform}`);

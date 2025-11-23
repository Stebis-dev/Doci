// // // provide project directory entry point so that the cli could scan and parse the project
// // console.log('Hello World');

// // import * as fs from "fs";
// // import * as path from "path";

// // /**
// //  * Recursively scans a directory and prints a tree-like structure.
// //  * @param dir - The directory path to scan
// //  * @param prefix - The current indentation prefix (used internally)
// //  */
// // function scanDirectory(dir: string, prefix = ""): void {
// //     const items = fs.readdirSync(dir, { withFileTypes: true });

// //     items.forEach((item, index) => {
// //         const isLast = index === items.length - 1;
// //         const pointer = isLast ? "└── " : "├── ";
// //         const itemPath = path.join(dir, item.name);

// //         // console.log(prefix + pointer + item.name);

// //         if (item.isDirectory()) {
// //             const nextPrefix = prefix + (isLast ? "    " : "│   ");
// //             scanDirectory(itemPath, nextPrefix);
// //         }
// //     });
// // }

// // // Default to current directory if none provided
// // const targetDir: string = process.argv[2] || process.cwd();

// // console.log(`📂 Scanning directory: ${targetDir}\n`);
// // scanDirectory(targetDir);



// import { Invoker } from './CommandInvoker';
// import { ScanCommand } from './commands/scan/ScanCommand';
// import { GenerateDiagramCommand } from './commands/GenerateDiagramCommand';
// import { ExportCommand } from './commands/ExportCommand';

// async function main() {
//     const [, , cmd, ...rest] = process.argv;
//     const inv = new Invoker();

//     switch (cmd) {
//         case 'scan': {
//             const dir = rest[0] || process.cwd();
//             inv.setCommand(new ScanCommand(dir));
//             break;
//         }
//         case 'generate-diagram': {
//             const dir = rest[0] || process.cwd();
//             const out = rest[1];
//             inv.setCommand(new GenerateDiagramCommand(dir, out));
//             break;
//         }
//         case 'export': {
//             const dir = rest[0] || process.cwd();
//             const format = rest[1] || 'json';
//             const out = rest[2];
//             inv.setCommand(new ExportCommand(dir, format, out));
//             break;
//         }
//         default:
//             console.log('Usage: doci-cli <command> [args]\n');
//             console.log('Commands:');
//             console.log('  scan <dir>                   Scan a directory and print file list');
//             console.log('  generate-diagram <dir> [out] Generate a diagram (stub)');
//             console.log('  export <dir> [format] [out]  Export documentation (stub)');
//             process.exit(1);
//     }

//     await inv.run();
// }

// main().catch((err) => {
//     console.error(err);
//     process.exit(1);
// });

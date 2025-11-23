// import * as fs from 'fs';
// import * as path from 'path';

//     constructor(private dir: string) { }

//     execute(): void {
//         const dirPath = this.dir || process.cwd();
//         if (!fs.existsSync(dirPath)) {
//             console.error('Directory not found:', dirPath);
//             process.exit(2);
//         }

//         const files: string[] = [];

//         const walk = (d: string) => {
//             for (const name of fs.readdirSync(d)) {
//                 const full = path.join(d, name);
//                 const stat = fs.statSync(full);
//                 if (stat.isDirectory()) walk(full);
//                 else files.push(full);
//             }
//         };

//         walk(dirPath);

//         const out = { projectPath: dirPath, files };
//         console.log(JSON.stringify(out, null, 2));
//     }
// }



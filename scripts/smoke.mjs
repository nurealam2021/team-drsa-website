import { readFileSync, existsSync } from "node:fs";
const files=["app/layout.tsx","app/page.tsx","components/EnterpriseWebsite.tsx","lib/content.ts","lib/storage.ts","app/api/consultation/route.ts","app/admin/page.tsx"];
for(const file of files){if(!existsSync(file))throw new Error(`Missing required file: ${file}`)}
const combined=files.map(file=>readFileSync(file,"utf8")).join("\n");
for(const oldBrand of ["RedCore Technologies","Team RA$D"]){if(combined.includes(oldBrand))throw new Error(`Old brand reference remains: ${oldBrand}`)}
const pkg=JSON.parse(readFileSync("package.json","utf8"));
for(const [name,version] of Object.entries({...pkg.dependencies,...pkg.devDependencies})){if(version==="latest"||version==="*")throw new Error(`Unpinned dependency: ${name}`)}
console.log("Smoke checks passed: required architecture present, canonical brand clean, dependencies pinned.");

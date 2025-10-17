---
timestamp: 'Fri Oct 17 2025 01:18:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_011806.3fca3eaf.md]]'
content_id: c396e1296d12b53be64e2972367a3c261bc3a147c46c6c3a689e1da0e85aebd5
---

# file: deno.json

```json
{
    "imports": {
        "@std/assert": "jsr:@std/assert@0.218.2",
        "@std/dotenv": "jsr:@std/dotenv@0.218.2",
        "@std/uuid": "jsr:@std/uuid@0.218.2",
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/",
        "mongodb": "npm:mongodb@6.10.0",
        "@google/generative-ai": "npm:@google/generative-ai@^0.21.0"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}
```

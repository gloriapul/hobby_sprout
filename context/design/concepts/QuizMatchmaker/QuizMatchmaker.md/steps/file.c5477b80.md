---
timestamp: 'Thu Nov 06 2025 17:36:06 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_173606.9ff15637.md]]'
content_id: c5477b80f26fdb6b881eac11c68221b2145fe61d84ce2dec94f7de1f04f6c98d
---

# file: deno.json

```json
{
    "imports": {
        "@hono/hono": "jsr:@hono/hono@^4.10.1",
        "@std/assert": "jsr:@std/assert@0.218.2",
        "@std/cli": "jsr:@std/cli@^1.0.23",
        "@std/dotenv": "jsr:@std/dotenv@0.218.2",
        "@std/fs": "jsr:@std/fs@^1.0.19",
        "@std/path": "jsr:@std/path@^1.1.2",
        "@std/uuid": "jsr:@std/uuid@0.218.2",
        "@concepts/": "./src/concepts/",
        "@concepts": "./src/concepts/concepts.ts",
        "@test-concepts": "./src/concepts/test_concepts.ts",
        "@utils/": "./src/utils/",
        "@engine": "./src/engine/mod.ts",
        "@syncs": "./src/syncs/syncs.ts",
        "mongodb": "npm:mongodb@6.10.0",
        "@google/generative-ai": "npm:@google/generative-ai@^0.21.0"
    },
    "tasks": {
        "start": "deno run --allow-net --allow-write --allow-read --allow-sys --allow-env src/main.ts",
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api",
        "import": "deno run --allow-read --allow-write --allow-env src/utils/generate_imports.ts",
        "build": "deno run import"
    },
    "lint": {
        "rules": {
            "exclude": [
                "no-import-prefix",
                "no-unversioned-import"
            ]
        }
    }
}
```

---
timestamp: 'Sat Oct 25 2025 14:34:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251025_143449.ff49439d.md]]'
content_id: 4b626189ad97525612dbb155ddb320fd40ad8cda5bf6de2dcc11b47dc6fed4e4
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
        "@utils/": "./src/utils/",
        "mongodb": "npm:mongodb@6.10.0",
        "@google/generative-ai": "npm:@google/generative-ai@^0.21.0"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}
```

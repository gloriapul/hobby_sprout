---
timestamp: 'Thu Oct 16 2025 22:17:27 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_221727.23175ab0.md]]'
content_id: cb99ef2976908133f88c9e437d2dbb0eaf087742df4a44e7315325f6e0f588e3
---

# file: deno.json

```json
{
    "imports": {
        "@std/assert": "jsr:@std/assert@0.218.2",
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/",
        "mongodb": "npm:mongodb@^6.20.0",
        "@google/generative-ai": "npm:@google/generative-ai@^0.21.0"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}
```

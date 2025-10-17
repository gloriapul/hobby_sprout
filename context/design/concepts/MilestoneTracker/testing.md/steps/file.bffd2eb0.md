---
timestamp: 'Thu Oct 16 2025 22:56:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225613.66026965.md]]'
content_id: bffd2eb0c9a0a47d59b89cff645f2c1d34f2e12f42ddeff90b2232f590f103b9
---

# file: src/utils/gemini-llm.ts

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Configuration for the Gemini LLM.
 */
export interface Config {
  apiKey: string;
}

/**
 * A utility class to interact with the Google Gemini Large Language Model.
 */
export class GeminiLLM {
  private genAI: GoogleGenerativeAI;

  constructor(config: Config) {
    if (!config.apiKey) {
      throw new Error("Gemini API Key is required for LLM initialization.");
    }
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  /**
   * Executes a prompt against the Gemini LLM and returns the generated text.
   * @param prompt The text prompt to send to the LLM.
   * @returns A promise that resolves with the LLM's text response.
   * @throws An error if the LLM call fails.
   */
  async executeLLM(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (!text) {
        throw new Error("LLM returned an empty response.");
      }
      return text;
    } catch (error) {
      console.error("Error calling Gemini LLM:", error);
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
```

## MilestoneTracker Concept Implementation

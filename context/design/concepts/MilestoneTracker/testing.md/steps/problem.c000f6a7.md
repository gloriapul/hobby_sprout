---
timestamp: 'Thu Oct 16 2025 22:31:38 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_223138.6f6784f9.md]]'
content_id: c000f6a7b42fc93c08575d6cf9586cdc8a3d9276afdb97f4787abb137d1d63d1
---

# problem: LLM Dependency for Testing

The `MilestoneTrackerConcept.generateSteps` action directly instantiates `new GeminiLLM()` within its constructor, creating a hard dependency on the actual LLM implementation. This design makes it challenging to:

1. **Run tests deterministically**: The output from a real LLM can be variable, leading to flaky tests.
2. **Run tests efficiently**: Making actual network calls to an LLM API is slow and adds significant overhead to test suites.
3. **Run tests in isolation**: Requires network access and valid API keys (e.g., `GOOGLE_API_KEY`, `GOOGLE_MODEL_NAME`), preventing true unit testing where only the concept's logic is under scrutiny.

---
timestamp: 'Thu Oct 16 2025 22:31:38 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_223138.6f6784f9.md]]'
content_id: 221b23acac49d3da3691bcf3057ba942abc0acc53ac9f7bdcf4e5cb1581b46ab
---

# solution: Dependency Injection for LLM

To address the testing challenges, the `MilestoneTrackerConcept` is modified to accept an optional `LLMService` implementation in its constructor. This pattern, known as dependency injection, allows a mock `LLMService` to be provided during testing, enabling deterministic, fast, and isolated tests. In a production environment, if no `LLMService` is provided, the concept defaults to using the `GeminiLLM` as originally intended.

The updated `MilestoneTrackerConcept.ts` (already provided above) includes these changes:

1. An `LLMService` interface is defined for type safety.
2. The `llm` property in `MilestoneTrackerConcept` is typed with `LLMService`.
3. The constructor now accepts an optional `llmService: LLMService` parameter, using it if provided, or falling back to `new GeminiLLM()` otherwise.

This modification enhances the testability of the `MilestoneTrackerConcept` without altering its production behavior.

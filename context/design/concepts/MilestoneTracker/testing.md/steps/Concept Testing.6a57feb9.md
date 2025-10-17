---
timestamp: 'Thu Oct 16 2025 22:56:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225613.66026965.md]]'
content_id: 6a57feb9a308abdd3c74c1c359d2bdce1fdbc7ed6492e85c10a40ce783905fed
---

# Concept Testing: MilestoneTracker

To properly test the `MilestoneTrackerConcept`, especially the `generateSteps` action, we need to mock the `GeminiLLM` to return predictable results. This avoids actual API calls and ensures test determinism. We'll achieve this by creating a mock `GeminiLLM` class that can be injected.

---
timestamp: 'Thu Oct 16 2025 23:00:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_230033.ac3a080e.md]]'
content_id: 0da3d2e0e9cda6d380a52d3ea3cf0d1d402c94242b8f7e3571222e2a364fd9a5
---

# trace: Fulfilling the MilestoneTracker Principle

The principle states: "After a user inputs their goal, they will have the option of having an LLM generate their list of recommended steps or will be able to input their own. They can then mark steps as complete, and will be allowed to see those that they have yet to complete and those that have been completed."

Here's a detailed trace demonstrating how the actions fulfill this principle:

1. **User defines a Goal:**
   * **Action:** `createGoal(user: "user:principle", description: "Become proficient in WebAssembly")`
   * **Effect:** A new `Goal` is created for "user:principle" with the description "Become proficient in WebAssembly", and it's marked as `isActive: true`.
   * **Verification:** `_getGoal({user: "user:principle"})` returns this newly created active goal.

2. **User opts for LLM-generated steps:**
   * **Action:** `generateSteps(goal: <principleGoalId>, prompt: "Break this goal into key learning and project steps.")`
   * **Effect:** The LLM processes the goal description and prompt, generating a list of steps (e.g., "Learn WASM fundamentals", "Understand WASM toolchain", "Build a simple WASM project"). Each generated description becomes a new `Step` associated with `<principleGoalId>`, `isComplete` is `false`, and `start` is the current date.
   * **Verification:** `_getSteps({goal: <principleGoalId>})` shows multiple new steps, all incomplete. `_getIncompleteSteps({goal: <principleGoalId>})` returns all these steps. `_getCompleteSteps({goal: <principleGoalId>})` returns an empty array.

3. **User adds a manual step:**
   * **Action:** `addStep(goal: <principleGoalId>, description: "Build a simple calculator in WASM")`
   * **Effect:** A new `Step` is created and associated with `<principleGoalId>`, with the provided description, `isComplete: false`, and `start` as the current date.
   * **Verification:** `_getSteps({goal: <principleGoalId>})` now shows one more step than before, and this new step is also incomplete.

4. **User marks progress by completing steps:**
   * **Action:** `completeStep(step: <idOfGeneratedStep1>)`
   * **Effect:** The `isComplete` field of `<idOfGeneratedStep1>` is set to `true`, and its `completion` date is set to the current date.
   * **Verification:**
     * `_getSteps({goal: <principleGoalId>})` shows `<idOfGeneratedStep1>` as `isComplete: true` and with a `completion` date.
     * `_getIncompleteSteps({goal: <principleGoalId>})` returns one less step.
     * `_getCompleteSteps({goal: <principleGoalId>})` returns `<idOfGeneratedStep1>`.
   * **Action:** `completeStep(step: <idOfManualStep>)`
   * **Effect:** Similar to the above, the manual step is marked complete.
   * **Verification:** The query results (incomplete vs. complete steps) are updated accordingly. The user can now see their progress.

5. **User finishes the goal:**

   * **Action:** `closeGoal(goal: <principleGoalId>)`
   * **Effect:** The `isActive` field of the goal `<principleGoalId>` is set to `false`.
   * **Verification:** `_getGoal({user: "user:principle"})` now returns an empty array, indicating no active goal. The goal still exists in the database but is no longer actively tracked.

   \#question: do not use any dummy id. the gemini llm file provided as context already has the work necessary to use the llm.

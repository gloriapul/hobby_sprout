---
timestamp: 'Thu Oct 16 2025 23:01:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_230125.d21b7ff4.md]]'
content_id: 80eac183c665c4245ea3b41ec5370d780ad25d51f134e62bc3a1146b3eac5112
---

# file: src/concepts/MilestoneTracker/MilestoneTrackerConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertArrayIncludes } from "jsr:@std/assert";
import { testDb, freshID } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import MilestoneTrackerConcept from "@concepts/MilestoneTracker/MilestoneTrackerConcept.ts";

// In a real application, the API key would be loaded from environment variables (e.g., Deno.env.get("GEMINI_API_KEY")).
// For testing purposes, we use a placeholder. The GeminiLLM utility might require a valid key to actually
// perform requests; however, for local unit tests without network calls, a placeholder is sufficient
// as long as the LLM utility doesn't fail on initialization with an invalid key.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "dummy-api-key-for-tests";

Deno.test("MilestoneTrackerConcept - Actions and Queries", async (t) => {
  const [db, client] = await testDb();
  const milestoneTracker = new MilestoneTrackerConcept(db, GEMINI_API_KEY);

  const userAlice = "user:alice" as ID;
  const userBob = "user:bob" as ID;

  await t.step("createGoal: Successfully creates a new active goal for a user", async () => {
    console.log("--- Test: createGoal (success) ---");
    const result = await milestoneTracker.createGoal({ user: userAlice, description: "Learn Deno" });
    assertExists((result as { goal: ID }).goal, "Should return a goal ID on success");
    const goalId = (result as { goal: ID }).goal;
    console.log(`Goal created for Alice: ${goalId}`);

    const goals = await milestoneTracker._getGoal({ user: userAlice });
    assertEquals(goals.length, 1, "Should find one active goal for Alice");
    assertEquals(goals[0].description, "Learn Deno", "Goal description should match");
    assertEquals(goals[0].isActive, true, "Goal should be active");
    console.log("Verified goal state after creation.");
  });

  await t.step("createGoal: Fails if description is empty", async () => {
    console.log("--- Test: createGoal (empty description) ---");
    const result = await milestoneTracker.createGoal({ user: userBob, description: "" });
    assertExists((result as { error: string }).error, "Should return an error for empty description");
    assertEquals((result as { error: string }).error, "Goal description cannot be empty.", "Error message should match");
    console.log("Verified error for empty description.");
  });

  await t.step("createGoal: Fails if an active goal already exists for the user", async () => {
    console.log("--- Test: createGoal (existing active goal) ---");
    // Alice already has an active goal from the previous test
    const result = await milestoneTracker.createGoal({ user: userAlice, description: "Another Goal" });
    assertExists((result as { error: string }).error, "Should return an error for existing active goal");
    assertArrayIncludes([(result as { error: string }).error], [`An active goal already exists for user ${userAlice}.`]);
    console.log("Verified error for existing active goal.");
  });

  let aliceGoalId: ID; // To store Alice's goal ID for subsequent tests

  await t.step("setup: Retrieve Alice's goal ID", async () => {
    const goals = await milestoneTracker._getGoal({ user: userAlice });
    assertNotEquals(goals.length, 0, "Alice should have an active goal to retrieve.");
    aliceGoalId = goals[0].id;
    console.log(`Alice's active goal ID: ${aliceGoalId}`);
  });

  await t.step("addStep: Successfully adds a step to an existing active goal", async () => {
    console.log("--- Test: addStep (success) ---");
    assertExists(aliceGoalId, "Alice's goal ID must be set for this test.");
    const result = await milestoneTracker.addStep({ goal: aliceGoalId, description: "Read Deno documentation" });
    assertExists((result as { step: ID }).step, "Should return a step ID on success");
    const stepId = (result as { step: ID }).step;
    console.log(`Step added: ${stepId}`);

    const steps = await milestoneTracker._getSteps({ goal: aliceGoalId });
    assertEquals(steps.length, 1, "Should find one step for Alice's goal");
    assertEquals(steps[0].description, "Read Deno documentation", "Step description should match");
    assertEquals(steps[0].isComplete, false, "Step should be incomplete by default");
    console.log("Verified step state after addition.");
  });

  await t.step("addStep: Fails if description is empty", async () => {
    console.log("--- Test: addStep (empty description) ---");
    const result = await milestoneTracker.addStep({ goal: aliceGoalId, description: "" });
    assertExists((result as { error: string }).error, "Should return an error for empty description");
    assertEquals((result as { error: string }).error, "Step description cannot be empty.", "Error message should match");
    console.log("Verified error for empty description.");
  });

  await t.step("addStep: Fails if goal does not exist or is not active", async () => {
    console.log("--- Test: addStep (invalid goal) ---");
    const nonExistentGoal = freshID();
    const result = await milestoneTracker.addStep({ goal: nonExistentGoal, description: "Non-existent goal step" });
    assertExists((result as { error: string }).error, "Should return an error for non-existent goal");
    assertArrayIncludes([(result as { error: string }).error], [`Goal ${nonExistentGoal} not found or is not active.`]);
    console.log("Verified error for invalid goal.");
  });

  await t.step("generateSteps: Fails if prompt is empty", async () => {
    console.log("--- Test: generateSteps (empty prompt) ---");
    const result = await milestoneTracker.generateSteps({ goal: aliceGoalId, prompt: "" });
    assertExists((result as { error: string }).error, "Should return an error for empty prompt");
    assertEquals((result as { error: string }).error, "LLM prompt cannot be empty.", "Error message should match");
    console.log("Verified error for empty prompt.");
  });

  await t.step("generateSteps: Fails if steps already exist for the goal", async () => {
    console.log("--- Test: generateSteps (existing steps) ---");
    // Alice's goal already has one step from addStep test
    const result = await milestoneTracker.generateSteps({ goal: aliceGoalId, prompt: "Advanced Deno topics" });
    assertExists((result as { error: string }).error, "Should return an error if steps already exist");
    assertArrayIncludes([(result as { error: string }).error], [`Steps already exist for goal ${aliceGoalId}.`]);
    console.log("Verified error for existing steps when generating.");
  });

  // To test generateSteps successfully, we need a new goal with no steps.
  let bobGoalId: ID;
  await t.step("setup: Create a new goal for Bob to test generateSteps", async () => {
    const createResult = await milestoneTracker.createGoal({ user: userBob, description: "Build a Deno API" });
    assertExists((createResult as { goal: ID }).goal, "Should create a goal for Bob");
    bobGoalId = (createResult as { goal: ID }).goal;
    console.log(`Bob's goal created for generateSteps test: ${bobGoalId}`);
  });

  await t.step("generateSteps: Successfully generates steps for a goal", async () => {
    console.log("--- Test: generateSteps (success) ---");
    assertExists(bobGoalId, "Bob's goal ID must be set for this test.");
    const prompt = "Break down into planning, coding, and deployment phases.";
    const result = await milestoneTracker.generateSteps({ goal: bobGoalId, prompt });

    // Assuming LLM returns a valid JSON array of strings
    assertExists((result as { steps: ID[] }).steps, "Should return an array of step IDs");
    const generatedSteps = (result as { steps: ID[] }).steps;
    assertNotEquals(generatedSteps.length, 0, "Should generate at least one step");
    console.log(`Generated steps for Bob's goal: ${generatedSteps.join(", ")}`);

    const steps = await milestoneTracker._getSteps({ goal: bobGoalId });
    assertEquals(steps.length, generatedSteps.length, "Number of stored steps should match generated");
    steps.forEach(s => {
      assertEquals(s.isComplete, false, "Generated steps should be incomplete");
      assertExists(s.start, "Generated steps should have a start date");
    });
    console.log("Verified generated steps are stored and incomplete.");
  });

  let aliceStep1Id: ID;
  await t.step("setup: Get Alice's first step ID for completion test", async () => {
    const steps = await milestoneTracker._getSteps({ goal: aliceGoalId });
    assertNotEquals(steps.length, 0, "Alice should have steps for completion test.");
    aliceStep1Id = steps[0].id;
    console.log(`Alice's step to complete: ${aliceStep1Id}`);
  });

  await t.step("completeStep: Successfully marks a step as complete", async () => {
    console.log("--- Test: completeStep (success) ---");
    assertExists(aliceStep1Id, "Alice's step ID must be set.");
    const result = await milestoneTracker.completeStep({ step: aliceStep1Id });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");
    console.log(`Step ${aliceStep1Id} completed.`);

    const steps = await milestoneTracker._getSteps({ goal: aliceGoalId });
    const completedStep = steps.find(s => s.id === aliceStep1Id);
    assertExists(completedStep, "The completed step should still exist");
    assertEquals(completedStep.isComplete, true, "Step should be marked as complete");
    assertExists(completedStep.completion, "Step should have a completion date");
    console.log("Verified step is complete with completion date.");
  });

  await t.step("completeStep: Fails if step is already complete", async () => {
    console.log("--- Test: completeStep (already complete) ---");
    const result = await milestoneTracker.completeStep({ step: aliceStep1Id });
    assertExists((result as { error: string }).error, "Should return an error if step is already complete");
    assertArrayIncludes([(result as { error: string }).error], [`Step ${aliceStep1Id} is already complete.`]);
    console.log("Verified error for already complete step.");
  });

  await t.step("completeStep: Fails if step does not exist", async () => {
    console.log("--- Test: completeStep (non-existent step) ---");
    const nonExistentStep = freshID();
    const result = await milestoneTracker.completeStep({ step: nonExistentStep });
    assertExists((result as { error: string }).error, "Should return an error for non-existent step");
    assertArrayIncludes([(result as { error: string }).error], [`Step ${nonExistentStep} not found.`]);
    console.log("Verified error for non-existent step.");
  });

  await t.step("closeGoal: Successfully closes an active goal", async () => {
    console.log("--- Test: closeGoal (success) ---");
    assertExists(aliceGoalId, "Alice's goal ID must be set.");
    const result = await milestoneTracker.closeGoal({ goal: aliceGoalId });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");
    console.log(`Goal ${aliceGoalId} closed.`);

    const goals = await milestoneTracker._getGoal({ user: userAlice });
    assertEquals(goals.length, 0, "Should find no active goal for Alice after closing");
    // Verify it exists but is inactive by checking the raw collection
    const inactiveGoal = await db.collection("MilestoneTracker.goals").findOne({ _id: aliceGoalId });
    assertExists(inactiveGoal, "Goal should still exist in DB");
    assertEquals(inactiveGoal.isActive, false, "Goal should be marked inactive");
    console.log("Verified goal is inactive after closing.");
  });

  await t.step("closeGoal: Fails if goal does not exist or is not active", async () => {
    console.log("--- Test: closeGoal (invalid goal) ---");
    const nonExistentGoal = freshID();
    const result = await milestoneTracker.closeGoal({ goal: nonExistentGoal });
    assertExists((result as { error: string }).error, "Should return an error for non-existent goal");
    assertArrayIncludes([(result as { error: string }).error], [`Goal ${nonExistentGoal} not found or is not active.`]);
    console.log("Verified error for invalid goal when closing.");

    // Test with Alice's goal, which is now inactive
    const resultInactive = await milestoneTracker.closeGoal({ goal: aliceGoalId });
    assertExists((resultInactive as { error: string }).error, "Should return error for inactive goal");
    assertArrayIncludes([(resultInactive as { error: string }).error], [`Goal ${aliceGoalId} not found or is not active.`]);
    console.log("Verified error for inactive goal when closing.");
  });

  await t.step("completeStep: Fails if goal associated with step is not active", async () => {
    console.log("--- Test: completeStep (inactive goal) ---");
    // Create a new goal, add a step, close the goal, then try to complete the step.
    const userCharlie = "user:charlie" as ID;
    const charlieGoalResult = await milestoneTracker.createGoal({ user: userCharlie, description: "Learn Cooking" });
    const charlieGoalId = (charlieGoalResult as { goal: ID }).goal;
    const charlieStepResult = await milestoneTracker.addStep({ goal: charlieGoalId, description: "Chop onions" });
    const charlieStepId = (chlieStepResult as { step: ID }).step;

    await milestoneTracker.closeGoal({ goal: charlieGoalId }); // Now goal is inactive
    const result = await milestoneTracker.completeStep({ step: charlieStepId });
    assertExists((result as { error: string }).error, "Should return an error for step in inactive goal");
    assertArrayIncludes([(result as { error: string }).error], [`Goal associated with step ${charlieStepId} is not active. Cannot complete step.`]);
    console.log("Verified error for completing step in inactive goal.");
  });

  // --- Principle Trace Test ---
  await t.step("Principle Trace: Fulfilling the MilestoneTracker purpose", async () => {
    console.log("\n--- Principle Trace Test ---");
    const userPrinciple = "user:principle" as ID;
    const goalDescription = "Become proficient in WebAssembly";
    const llmPrompt = "Break this goal into key learning and project steps.";

    console.log(`1. Create a new goal for user ${userPrinciple}: "${goalDescription}"`);
    const createGoalResult = await milestoneTracker.createGoal({ user: userPrinciple, description: goalDescription });
    assertExists((createGoalResult as { goal: ID }).goal, "Principle: Goal creation successful.");
    const principleGoalId = (createGoalResult as { goal: ID }).goal;
    console.log(`   Goal ID: ${principleGoalId}`);

    let activeGoals = await milestoneTracker._getGoal({ user: userPrinciple });
    assertEquals(activeGoals.length, 1, "Principle: User should have one active goal.");
    assertEquals(activeGoals[0].description, goalDescription);
    console.log(`   Verified goal "${activeGoals[0].description}" is active.`);

    console.log(`2. Generate steps for the goal using LLM with prompt: "${llmPrompt}"`);
    const generateStepsResult = await milestoneTracker.generateSteps({ goal: principleGoalId, prompt: llmPrompt });
    assertExists((generateStepsResult as { steps: ID[] }).steps, "Principle: Steps generation successful.");
    const generatedStepsIds = (generateStepsResult as { steps: ID[] }).steps;
    assertNotEquals(generatedStepsIds.length, 0, "Principle: At least one step should be generated.");
    console.log(`   Generated ${generatedStepsIds.length} steps.`);

    console.log(`3. Add a manual step: "Build a simple calculator in WASM"`);
    const addStepResult = await milestoneTracker.addStep({ goal: principleGoalId, description: "Build a simple calculator in WASM" });
    assertExists((addStepResult as { step: ID }).step, "Principle: Manual step addition successful.");
    const manualStepId = (addStepResult as { step: ID }).step;
    console.log(`   Added manual step: ${manualStepId}`);

    let allSteps = await milestoneTracker._getSteps({ goal: principleGoalId });
    assertEquals(allSteps.length, generatedStepsIds.length + 1, "Principle: All steps (generated + manual) should be present.");
    let incompleteSteps = await milestoneTracker._getIncompleteSteps({ goal: principleGoalId });
    assertEquals(incompleteSteps.length, allSteps.length, "Principle: Initially all steps should be incomplete.");
    assertEquals((await milestoneTracker._getCompleteSteps({ goal: principleGoalId })).length, 0, "Principle: No steps should be complete yet.");
    console.log(`   Currently, ${incompleteSteps.length} incomplete steps and 0 complete steps.`);

    console.log(`4. Complete some steps (e.g., the first generated step and the manual step)`);
    if (generatedStepsIds.length > 0) {
      await milestoneTracker.completeStep({ step: generatedStepsIds[0] });
      console.log(`   Completed generated step: ${generatedStepsIds[0]}`);
    }
    await milestoneTracker.completeStep({ step: manualStepId });
    console.log(`   Completed manual step: ${manualStepId}`);

    incompleteSteps = await milestoneTracker._getIncompleteSteps({ goal: principleGoalId });
    let completeSteps = await milestoneTracker._getCompleteSteps({ goal: principleGoalId });
    assertEquals(incompleteSteps.length, allSteps.length - 2, "Principle: Two steps should now be complete (assuming generatedStepsIds.length > 0).");
    assertEquals(completeSteps.length, 2, "Principle: Two steps should now be in the complete list.");
    console.log(`   Now, ${incompleteSteps.length} incomplete steps and ${completeSteps.length} complete steps.`);

    console.log("5. Verify specific steps' completion status.");
    const updatedSteps = await milestoneTracker._getSteps({ goal: principleGoalId });
    const completedGenStep = updatedSteps.find(s => s.id === generatedStepsIds[0]);
    assertExists(completedGenStep, "Completed generated step should exist.");
    assertEquals(completedGenStep.isComplete, true, "Completed generated step status verified.");
    assertExists(completedGenStep.completion, "Completed generated step completion date verified.");

    const completedManStep = updatedSteps.find(s => s.id === manualStepId);
    assertExists(completedManStep, "Completed manual step should exist.");
    assertEquals(completedManStep.isComplete, true, "Completed manual step status verified.");
    assertExists(completedManStep.completion, "Completed manual step completion date verified.");
    console.log("   Verified individual step completion status.");

    console.log(`6. Close the goal: "${goalDescription}"`);
    await milestoneTracker.closeGoal({ goal: principleGoalId });
    console.log(`   Goal ${principleGoalId} closed.`);

    activeGoals = await milestoneTracker._getGoal({ user: userPrinciple });
    assertEquals(activeGoals.length, 0, "Principle: User should have no active goals after closing.");
    console.log("   Verified goal is no longer active.");
    console.log("--- Principle Trace Test Complete ---");
  });

  await client.close();
});
```

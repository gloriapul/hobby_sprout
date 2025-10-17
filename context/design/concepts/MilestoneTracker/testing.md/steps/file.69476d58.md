---
timestamp: 'Thu Oct 16 2025 22:31:38 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_223138.6f6784f9.md]]'
content_id: 69476d58ecc61e24698a2e1f2b7e3ab6dd72461ef61bb993ea8ba18c29073845
---

# file: src/concepts/MilestoneTracker/MilestoneTrackerConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assert, assertArrayIncludes } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";

// Import the concept (already modified to accept LLM in constructor for testing)
import MilestoneTrackerConcept from "./MilestoneTrackerConcept.ts";

// Define a Mock LLM Service for deterministic testing.
// This mock will return a predefined JSON string when `generateText` is called,
// allowing us to test the concept's logic without external API calls.
class MockLLMService {
  async generateText(_prompt: string): Promise<string> {
    return JSON.stringify([
      "LLM generated step 1",
      "LLM generated step 2",
      "LLM generated step 3",
    ]);
  }
}

// Helper for generating user IDs for tests
const userA = "user:Alice" as ID;
const userB = "user:Bob" as ID;
const userC = "user:Charlie" as ID;

Deno.test("MilestoneTracker Concept - Action Tests", async (t) => {
  const [db, client] = await testDb();
  // Instantiate the concept with the MockLLMService for testing
  const concept = new MilestoneTrackerConcept(db, new MockLLMService());

  await t.step("createGoal: should successfully create a new goal for a user", async () => {
    console.log("--- Test: createGoal (success) ---");
    const result = await concept.createGoal({ user: userA, description: "Learn Deno" });
    assert("goal" in result, `Expected goal, got: ${JSON.stringify(result)}`);
    const goalId = result.goal;
    assertNotEquals(goalId, undefined, "Goal ID should not be undefined");

    const fetchedGoal = await concept._getGoal({ user: userA });
    assertEquals(fetchedGoal.length, 1, "Should find exactly one active goal for user A");
    assertEquals(fetchedGoal[0].id, goalId, "Fetched goal ID should match created goal ID");
    assertEquals(fetchedGoal[0].description, "Learn Deno", "Goal description should match");
    assertEquals(fetchedGoal[0].isActive, true, "Goal should be active");
    console.log(`Goal created: ${goalId}, description: "Learn Deno"`);
  });

  await t.step("createGoal: should prevent creating a goal with an empty description", async () => {
    console.log("--- Test: createGoal (empty description) ---");
    const result = await concept.createGoal({ user: userB, description: "" });
    assert("error" in result, `Expected error, got: ${JSON.stringify(result)}`);
    assertEquals(result.error, "Goal description cannot be empty.", "Should return error for empty description");
    console.log(`Attempted to create goal with empty description for user B. Result: ${result.error}`);
  });

  await t.step("createGoal: should prevent creating a second active goal for the same user", async () => {
    console.log("--- Test: createGoal (second active goal) ---");
    // User A already has an active goal from previous test step
    const result = await concept.createGoal({ user: userA, description: "Another goal" });
    assert("error" in result, `Expected error, got: ${JSON.stringify(result)}`);
    assert(result.error.startsWith("An active goal already exists"), "Should return error for second active goal");
    console.log(`Attempted to create second active goal for user A. Result: ${result.error}`);
  });

  let goalIdForSteps: ID; // To store the goal created for step testing

  await t.step("createGoal: setup a new goal for step generation tests", async () => {
    console.log("--- Test: createGoal (setup for steps) ---");
    const result = await concept.createGoal({ user: userB, description: "Run a Marathon" });
    assert("goal" in result, `Expected goal, got: ${JSON.stringify(result)}`);
    goalIdForSteps = result.goal;
    console.log(`Setup Goal for user B: ${goalIdForSteps}, description: "Run a Marathon"`);
  });

  await t.step("generateSteps: should use LLM to generate steps for a goal", async () => {
    console.log("--- Test: generateSteps (success) ---");
    const prompt = "Break down into daily tasks.";
    const result = await concept.generateSteps({ goal: goalIdForSteps, prompt });
    assert("steps" in result, `Expected steps array, got: ${JSON.stringify(result)}`);
    assertArrayIncludes(result.steps, [], "Expected steps to be returned");
    assertEquals(result.steps.length, 3, "Expected 3 steps from mock LLM");

    const fetchedSteps = await concept._getSteps({ goal: goalIdForSteps });
    assertEquals(fetchedSteps.length, 3, "Should have 3 steps associated with the goal");
    assertEquals(fetchedSteps[0].description, "LLM generated step 1", "First step description should match mock LLM output");
    assertEquals(fetchedSteps[0].isComplete, false, "Steps should be incomplete by default");
    assert(fetchedSteps[0].start instanceof Date, "Step start date should be a Date object");
    console.log(`Generated steps for goal ${goalIdForSteps}: ${JSON.stringify(fetchedSteps.map(s => s.description))}`);
  });

  await t.step("generateSteps: should prevent generating steps if steps already exist", async () => {
    console.log("--- Test: generateSteps (steps already exist) ---");
    const result = await concept.generateSteps({ goal: goalIdForSteps, prompt: "Another prompt" });
    assert("error" in result, `Expected error, got: ${JSON.stringify(result)}`);
    assert(result.error.startsWith("Steps already exist"), "Should return error if steps already exist");
    console.log(`Attempted to generate steps for goal ${goalIdForSteps} again. Result: ${result.error}`);
  });

  await t.step("generateSteps: should prevent generating steps for non-existent or inactive goal", async () => {
    console.log("--- Test: generateSteps (invalid goal) ---");
    const nonExistentGoal = "goal:nonexistent" as ID;
    const result = await concept.generateSteps({ goal: nonExistentGoal, prompt: "Some prompt" });
    assert("error" in result, `Expected error, got: ${JSON.stringify(result)}`);
    assertEquals(result.error, `Goal ${nonExistentGoal} not found or is not active.`, "Should error for invalid goal");
    console.log(`Attempted to generate steps for non-existent goal. Result: ${result.error}`);
  });

  let addedStepId: ID;

  await t.step("addStep: should manually add a new step to a goal", async () => {
    console.log("--- Test: addStep (success) ---");
    const description = "Buy new running shoes";
    const result = await concept.addStep({ goal: goalIdForSteps, description });
    assert("step" in result, `Expected step, got: ${JSON.stringify(result)}`);
    addedStepId = result.step;
    assertNotEquals(addedStepId, undefined, "Step ID should not be undefined");

    const allSteps = await concept._getSteps({ goal: goalIdForSteps });
    const newStep = allSteps.find(s => s.id === addedStepId);
    assert(newStep !== undefined, "Newly added step should be found");
    assertEquals(newStep?.description, description, "Step description should match");
    assertEquals(newStep?.isComplete, false, "Step should be incomplete by default");
    assert(newStep?.start instanceof Date, "Step start date should be a Date object");
    assertEquals(allSteps.length, 4, "Total steps count should increase to 4");
    console.log(`Added manual step: ${addedStepId}, description: "${description}"`);
  });

  await t.step("addStep: should prevent adding a step with an empty description", async () => {
    console.log("--- Test: addStep (empty description) ---");
    const result = await concept.addStep({ goal: goalIdForSteps, description: "" });
    assert("error" in result, `Expected error, got: ${JSON.stringify(result)}`);
    assertEquals(result.error, "Step description cannot be empty.", "Should return error for empty description");
    console.log(`Attempted to add step with empty description. Result: ${result.error}`);
  });

  await t.step("completeStep: should mark an existing step as complete", async () => {
    console.log("--- Test: completeStep (success) ---");
    const stepsBefore = await concept._getSteps({ goal: goalIdForSteps });
    const stepToComplete = stepsBefore.find(s => s.description === "LLM generated step 1");
    assert(stepToComplete !== undefined, "Step to complete must exist");

    const result = await concept.completeStep({ step: stepToComplete!.id });
    assert(!("error" in result), `Expected success, got: ${JSON.stringify(result)}`);

    const updatedStep = (await concept._getSteps({ goal: goalIdForSteps })).find(s => s.id === stepToComplete!.id);
    assertEquals(updatedStep?.isComplete, true, "Step should be marked as complete");
    assert(updatedStep?.completion instanceof Date, "Completion date should be set");
    console.log(`Completed step: ${stepToComplete!.id}`);
  });

  await t.step("completeStep: should prevent completing an already complete step", async () => {
    console.log("--- Test: completeStep (already complete) ---");
    const steps = await concept._getSteps({ goal: goalIdForSteps });
    const alreadyCompletedStep = steps.find(s => s.isComplete === true);
    assert(alreadyCompletedStep !== undefined, "An already completed step must exist");

    const result = await concept.completeStep({ step: alreadyCompletedStep!.id });
    assert("error" in result, `Expected error, got: ${JSON.stringify(result)}`);
    assert(result.error.startsWith("Step") && result.error.endsWith("is already complete."), "Should return error for already complete step");
    console.log(`Attempted to complete already completed step: ${alreadyCompletedStep!.id}. Result: ${result.error}`);
  });

  await t.step("completeStep: should prevent completing a step for an inactive goal", async () => {
    console.log("--- Test: completeStep (inactive goal) ---");
    // First, close userA's goal
    const userAGoal = (await concept._getGoal({ user: userA }))[0];
    assert(userAGoal !== undefined, "User A should have an active goal");
    await concept.closeGoal({ goal: userAGoal.id });
    console.log(`Closed goal: ${userAGoal.id}`);

    // Create a step for userA's now inactive goal (this is allowed by addStep if goal exists, not necessarily active)
    const stepForInactiveGoalResult = await concept.addStep({ goal: userAGoal.id, description: "An inactive step" });
    assert("step" in stepForInactiveGoalResult, `Expected step, got: ${JSON.stringify(stepForInactiveGoalResult)}`);
    const stepForInactiveGoalId = stepForInactiveGoalResult.step;
    console.log(`Added step ${stepForInactiveGoalId} to inactive goal ${userAGoal.id}`);

    const result = await concept.completeStep({ step: stepForInactiveGoalId });
    assert("error" in result, `Expected error, got: ${JSON.stringify(result)}`);
    assert(result.error.startsWith("Goal associated with step") && result.error.endsWith("is not active. Cannot complete step."), "Should return error for step of inactive goal");
    console.log(`Attempted to complete step ${stepForInactiveGoalId} of inactive goal. Result: ${result.error}`);
  });


  await t.step("closeGoal: should set a goal to inactive", async () => {
    console.log("--- Test: closeGoal (success) ---");
    const result = await concept.closeGoal({ goal: goalIdForSteps });
    assert(!("error" in result), `Expected success, got: ${JSON.stringify(result)}`);

    const fetchedGoal = await concept._getGoal({ user: userB });
    assertEquals(fetchedGoal.length, 0, "Should find no active goal for user B after closing");

    // Verify it's actually inactive by querying for all goals (not just active)
    const inactiveGoal = await concept.goals.findOne({ _id: goalIdForSteps });
    assert(inactiveGoal !== null, "Goal document should still exist");
    assertEquals(inactiveGoal.isActive, false, "Goal should be marked inactive in database");
    console.log(`Goal ${goalIdForSteps} closed.`);
  });

  await t.step("closeGoal: should prevent closing an already inactive or non-existent goal", async () => {
    console.log("--- Test: closeGoal (inactive/non-existent) ---");
    // Try closing the goal again
    const result1 = await concept.closeGoal({ goal: goalIdForSteps });
    assert("error" in result1, `Expected error, got: ${JSON.stringify(result1)}`);
    assert(result1.error.startsWith("Goal") && result1.error.endsWith("not found or is not active."), "Should return error for already inactive goal");
    console.log(`Attempted to close already inactive goal ${goalIdForSteps}. Result: ${result1.error}`);

    // Try closing a non-existent goal
    const nonExistentGoal = "goal:nonexistent" as ID;
    const result2 = await concept.closeGoal({ goal: nonExistentGoal });
    assert("error" in result2, `Expected error, got: ${JSON.stringify(result2)}`);
    assertEquals(result2.error, `Goal ${nonExistentGoal} not found or is not active.`, "Should return error for non-existent goal");
    console.log(`Attempted to close non-existent goal ${nonExistentGoal}. Result: ${result2.error}`);
  });


  await client.close(); // Close client after all tests
});


Deno.test("MilestoneTracker Concept - Query Tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new MilestoneTrackerConcept(db, new MockLLMService());

  let goalId1: ID, goalId2: ID;
  let step1_g1: ID, step2_g1: ID, step3_g1: ID; // Steps for goal1
  let step1_g2: ID; // Steps for goal2

  await t.step("Setup: Create goals and steps for query tests", async () => {
    console.log("--- Setup for Query Tests ---");
    const res1 = await concept.createGoal({ user: userA, description: "Master TypeScript" });
    assert("goal" in res1);
    goalId1 = res1.goal;
    console.log(`Created Goal 1 (${goalId1}) for ${userA}`);

    const res2 = await concept.createGoal({ user: userB, description: "Write a Novel" });
    assert("goal" in res2);
    goalId2 = res2.goal;
    console.log(`Created Goal 2 (${goalId2}) for ${userB}`);

    const res_s1_g1 = await concept.addStep({ goal: goalId1, description: "Read TypeScript Deep Dive" });
    assert("step" in res_s1_g1); step1_g1 = res_s1_g1.step;
    await concept.completeStep({ step: step1_g1 }); // Mark as complete
    console.log(`Added and completed Step 1 for Goal 1: ${step1_g1}`);

    const res_s2_g1 = await concept.addStep({ goal: goalId1, description: "Build a small Deno app" });
    assert("step" in res_s2_g1); step2_g1 = res_s2_g1.step;
    console.log(`Added incomplete Step 2 for Goal 1: ${step2_g1}`);

    const res_s3_g1 = await concept.addStep({ goal: goalId1, description: "Contribute to an open-source Deno project" });
    assert("step" in res_s3_g1); step3_g1 = res_s3_g1.step;
    console.log(`Added incomplete Step 3 for Goal 1: ${step3_g1}`);


    const res_s1_g2 = await concept.addStep({ goal: goalId2, description: "Outline chapters" });
    assert("step" in res_s1_g2); step1_g2 = res_s1_g2.step;
    console.log(`Added incomplete Step 1 for Goal 2: ${step1_g2}`);

    console.log("--- Setup Complete ---");
  });

  await t.step("_getGoal: should return the active goal for a user", async () => {
    console.log("--- Test: _getGoal ---");
    const userAGoals = await concept._getGoal({ user: userA });
    assertEquals(userAGoals.length, 1, "Should find one active goal for user A");
    assertEquals(userAGoals[0].id, goalId1, "Should return Goal 1 for user A");
    assertEquals(userAGoals[0].description, "Master TypeScript", "Description should match");
    assertEquals(userAGoals[0].isActive, true, "Goal should be active");
    console.log(`Fetched active goal for ${userA}: ${JSON.stringify(userAGoals)}`);

    const userBGoals = await concept._getGoal({ user: userB });
    assertEquals(userBGoals.length, 1, "Should find one active goal for user B");
    assertEquals(userBGoals[0].id, goalId2, "Should return Goal 2 for user B");
    console.log(`Fetched active goal for ${userB}: ${JSON.stringify(userBGoals)}`);

    // Test with a user that has no active goal
    const nonExistentUserGoals = await concept._getGoal({ user: "user:NoOne" as ID });
    assertEquals(nonExistentUserGoals.length, 0, "Should return empty array for non-existent user");
    console.log("Fetched goals for non-existent user: (empty array)");
  });

  await t.step("_getSteps: should return all steps for a given goal", async () => {
    console.log("--- Test: _getSteps ---");
    const goal1Steps = await concept._getSteps({ goal: goalId1 });
    assertEquals(goal1Steps.length, 3, "Should return all 3 steps for Goal 1");
    const stepDescriptions = goal1Steps.map(s => s.description);
    assertArrayIncludes(stepDescriptions, ["Read TypeScript Deep Dive", "Build a small Deno app", "Contribute to an open-source Deno project"], "Should include all step descriptions");
    assert(goal1Steps.some(s => s.id === step1_g1 && s.isComplete === true), "Step 1_g1 should be complete");
    assert(goal1Steps.some(s => s.id === step2_g1 && s.isComplete === false), "Step 2_g1 should be incomplete");
    console.log(`Fetched all steps for Goal 1: ${JSON.stringify(goal1Steps.map(s => ({ id: s.id, desc: s.description, complete: s.isComplete })))}`);

    const goal2Steps = await concept._getSteps({ goal: goalId2 });
    assertEquals(goal2Steps.length, 1, "Should return 1 step for Goal 2");
    assertEquals(goal2Steps[0].description, "Outline chapters", "Step description for Goal 2 should match");
    console.log(`Fetched all steps for Goal 2: ${JSON.stringify(goal2Steps.map(s => ({ id: s.id, desc: s.description, complete: s.isComplete })))}`);

    const nonExistentGoalSteps = await concept._getSteps({ goal: "goal:unknown" as ID });
    assertEquals(nonExistentGoalSteps.length, 0, "Should return empty array for non-existent goal");
    console.log("Fetched steps for non-existent goal: (empty array)");
  });

  await t.step("_getIncompleteSteps: should return only incomplete steps for a goal", async () => {
    console.log("--- Test: _getIncompleteSteps ---");
    const incompleteStepsGoal1 = await concept._getIncompleteSteps({ goal: goalId1 });
    assertEquals(incompleteStepsGoal1.length, 2, "Should return 2 incomplete steps for Goal 1");
    const incompleteDescriptions = incompleteStepsGoal1.map(s => s.description);
    assertArrayIncludes(incompleteDescriptions, ["Build a small Deno app", "Contribute to an open-source Deno project"], "Should only include incomplete step descriptions");
    assert(!incompleteDescriptions.includes("Read TypeScript Deep Dive"), "Should not include complete step");
    console.log(`Fetched incomplete steps for Goal 1: ${JSON.stringify(incompleteStepsGoal1.map(s => s.description))}`);

    const incompleteStepsGoal2 = await concept._getIncompleteSteps({ goal: goalId2 });
    assertEquals(incompleteStepsGoal2.length, 1, "Should return 1 incomplete step for Goal 2");
    assertEquals(incompleteStepsGoal2[0].description, "Outline chapters", "Description should match");
    console.log(`Fetched incomplete steps for Goal 2: ${JSON.stringify(incompleteStepsGoal2.map(s => s.description))}`);
  });

  await t.step("_getCompleteSteps: should return only complete steps for a goal", async () => {
    console.log("--- Test: _getCompleteSteps ---");
    const completeStepsGoal1 = await concept._getCompleteSteps({ goal: goalId1 });
    assertEquals(completeStepsGoal1.length, 1, "Should return 1 complete step for Goal 1");
    assertEquals(completeStepsGoal1[0].description, "Read TypeScript Deep Dive", "Description should match");
    assert(completeStepsGoal1[0].completion instanceof Date, "Completion date should be a Date object");
    console.log(`Fetched complete steps for Goal 1: ${JSON.stringify(completeStepsGoal1.map(s => s.description))}`);

    const completeStepsGoal2 = await concept._getCompleteSteps({ goal: goalId2 });
    assertEquals(completeStepsGoal2.length, 0, "Should return 0 complete steps for Goal 2");
    console.log("Fetched complete steps for Goal 2: (empty array)");
  });

  await client.close();
});


Deno.test("MilestoneTracker Concept - Principle Fulfillment Trace", async (t) => {
  const [db, client] = await testDb();
  const concept = new MilestoneTrackerConcept(db, new MockLLMService());
  const testUser = userC; // Using userC for the trace to avoid conflicts with previous tests

  console.log("\n--- Principle Fulfillment Trace Start ---");

  // 1. User inputs their goal
  await t.step("Trace: Create an initial goal", async () => {
    const createGoalResult = await concept.createGoal({
      user: testUser,
      description: "Learn to play the guitar proficiently",
    });
    assert("goal" in createGoalResult, `Expected goal, got: ${JSON.stringify(createGoalResult)}`);
    const goalId = createGoalResult.goal;
    console.log(`1. Goal "${(await concept._getGoal({ user: testUser}))[0].description}" created for ${testUser} (ID: ${goalId}).`);

    // Verify goal exists and is active
    const activeGoals = await concept._getGoal({ user: testUser });
    assertEquals(activeGoals.length, 1);
    assertEquals(activeGoals[0].id, goalId);
  });

  let currentGoalId: ID;
  await t.step("Trace: Retrieve current goal for subsequent steps", async () => {
    const activeGoals = await concept._getGoal({ user: testUser });
    assert(activeGoals.length > 0, "Should have an active goal");
    currentGoalId = activeGoals[0].id;
    console.log(`Current active goal ID for ${testUser}: ${currentGoalId}`);
  });


  // 2. User has the option of having an LLM generate their list of recommended steps
  await t.step("Trace: Generate steps using LLM", async () => {
    const generateStepsResult = await concept.generateSteps({
      goal: currentGoalId,
      prompt: "Break down into practical, short-term musical exercises.",
    });
    assert("steps" in generateStepsResult, `Expected steps, got: ${JSON.stringify(generateStepsResult)}`);
    assert(generateStepsResult.steps.length > 0, "LLM should have generated steps.");
    console.log(`2. LLM generated ${generateStepsResult.steps.length} steps.`);
    const llmSteps = await concept._getSteps({ goal: currentGoalId });
    console.log(`   Generated steps: ${llmSteps.map(s => s.description).join(", ")}`);

    // Verify steps were created and are incomplete
    assertEquals(llmSteps.length, 3);
    assert(llmSteps.every(s => !s.isComplete));
  });

  // 3. User can then mark steps as complete
  let stepToCompleteId: ID;
  await t.step("Trace: Mark one generated step as complete", async () => {
    const allSteps = await concept._getSteps({ goal: currentGoalId });
    stepToCompleteId = allSteps[0].id; // Pick the first step
    const completeStepResult = await concept.completeStep({ step: stepToCompleteId });
    assert(!("error" in completeStepResult), `Error completing step: ${JSON.stringify(completeStepResult)}`);
    console.log(`3. Marked step "${allSteps[0].description}" (ID: ${stepToCompleteId}) as complete.`);

    // Verify step is complete
    const updatedStep = (await concept._getSteps({ goal: currentGoalId })).find(s => s.id === stepToCompleteId);
    assertEquals(updatedStep?.isComplete, true);
    assert(updatedStep?.completion instanceof Date);
  });

  // 4. And will be allowed to see those that they have yet to complete and those that have been completed.
  await t.step("Trace: View incomplete and complete steps", async () => {
    const incompleteSteps = await concept._getIncompleteSteps({ goal: currentGoalId });
    console.log(`4a. Incomplete steps: ${incompleteSteps.map(s => s.description).join(", ")}`);
    assertEquals(incompleteSteps.length, 2, "Should have 2 incomplete steps");

    const completeSteps = await concept._getCompleteSteps({ goal: currentGoalId });
    console.log(`4b. Complete steps: ${completeSteps.map(s => s.description).join(", ")}`);
    assertEquals(completeSteps.length, 1, "Should have 1 complete step");
    assertEquals(completeSteps[0].id, stepToCompleteId, "The completed step should be the one marked");
  });

  console.log("--- Principle Fulfillment Trace End ---");

  await client.close();
});
```

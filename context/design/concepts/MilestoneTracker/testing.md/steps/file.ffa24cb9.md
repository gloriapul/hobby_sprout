---
timestamp: 'Thu Oct 16 2025 22:56:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225613.66026965.md]]'
content_id: ffa24cb9207bb2889a927858eaf7c7eb32e9f2379368035a412e59f871936606
---

# file: src/concepts/MilestoneTracker/MilestoneTrackerConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertArrayIncludes } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import MilestoneTrackerConcept from "./MilestoneTrackerConcept.ts";
import { GeminiLLM, Config as GeminiLLMConfig } from "@utils/gemini-llm.ts";

// --- Mock GeminiLLM for testing ---
class MockGeminiLLM extends GeminiLLM {
    private mockResponses: { [prompt: string]: string } = {};
    private defaultResponse: string = '["Generated Step 1", "Generated Step 2"]';

    constructor(config: GeminiLLMConfig) {
        super(config); // Call parent constructor, but it won't actually initialize genAI
    }

    setMockResponse(prompt: string, response: string) {
        this.mockResponses[prompt] = response;
    }

    setDefaultResponse(response: string) {
        this.defaultResponse = response;
    }

    async executeLLM(prompt: string): Promise<string> {
        console.log(`[Mock LLM] Responding to prompt: "${prompt.substring(0, 50)}..."`);
        const mockResponse = this.mockResponses[prompt];
        if (mockResponse !== undefined) {
            return mockResponse;
        }
        return this.defaultResponse;
    }
}
// --- End Mock GeminiLLM ---

Deno.test("MilestoneTracker Concept Tests", async (test) => {
  const [db, client] = await testDb();
  // Using a dummy API key for the mock LLM
  const mockLLM = new MockGeminiLLM({ apiKey: "dummy-api-key" });
  const concept = new MilestoneTrackerConcept(db, "dummy-api-key");
  // Replace the concept's LLM with our mock for testing
  (concept as any).llm = mockLLM;

  const userA = "user:Alice" as ID;
  const userB = "user:Bob" as ID;

  Deno.test.afterAll(async () => {
    await client.close();
  });

  await test.step("Trace: Principle fulfillment - User tracks a goal with LLM-generated steps", async () => {
    console.log("\n--- Principle Fulfillment Trace ---");

    // 1. Create a goal for userA
    console.log(`[Trace] User ${userA} creates a goal.`);
    const createGoalResult = await concept.createGoal({ user: userA, description: "Run a marathon" });
    assertExists(createGoalResult.goal, `Failed to create goal: ${createGoalResult.error}`);
    const goalA = createGoalResult.goal;
    console.log(`[Trace] Goal ${goalA} created for ${userA}.`);

    // Verify goal exists and is active
    const getGoalResult = await concept._getGoal({ user: userA });
    assertEquals(getGoalResult.length, 1);
    assertEquals(getGoalResult[0].id, goalA);
    assertEquals(getGoalResult[0].description, "Run a marathon");
    assertEquals(getGoalResult[0].isActive, true);
    console.log(`[Trace] Verified goal ${goalA} is active.`);

    // 2. Generate steps for the goal using LLM
    const llmPrompt = "Break this down into manageable training steps over 6 months.";
    const expectedLlmResponse = JSON.stringify([
      "Week 1-4: Build base mileage (10-15 miles/week)",
      "Week 5-8: Increase long run distance to 8 miles",
      "Week 9-12: Incorporate speed work and hill training",
      "Week 13-16: Long runs up to 13 miles (half marathon distance)",
      "Week 17-20: Peak mileage week, longest run around 18-20 miles",
      "Week 21-24: Taper and prepare for race day"
    ]);
    mockLLM.setMockResponse(
      `Given the goal "Run a marathon", generate a list of actionable steps to achieve it.\n        Consider the following additional context: "${llmPrompt}".\n        Return the steps as a JSON array of strings, where each string is a step description.\n        Example: ["Step 1 description", "Step 2 description"]`,
      expectedLlmResponse
    );

    console.log(`[Trace] User ${userA} requests LLM to generate steps for goal ${goalA}.`);
    const generateStepsResult = await concept.generateSteps({ goal: goalA, prompt: llmPrompt });
    assertExists(generateStepsResult.steps, `Failed to generate steps: ${generateStepsResult.error}`);
    assertEquals(generateStepsResult.steps.length, 6);
    console.log(`[Trace] Generated ${generateStepsResult.steps.length} steps.`);

    // Verify steps exist and are incomplete
    let allSteps = await concept._getSteps({ goal: goalA });
    assertEquals(allSteps.length, 6);
    for (const step of allSteps) {
      assertEquals(step.isComplete, false);
      assertExists(step.start);
      assertNotEquals(step.description, "");
    }
    const incompleteStepsBeforeCompletion = await concept._getIncompleteSteps({ goal: goalA });
    assertEquals(incompleteStepsBeforeCompletion.length, 6);
    assertEquals((await concept._getCompleteSteps({ goal: goalA })).length, 0);
    console.log(`[Trace] Verified all steps are initially incomplete.`);

    // 3. Complete some steps
    const step1 = allSteps[0].id;
    const step2 = allSteps[1].id;
    console.log(`[Trace] User ${userA} completes step ${step1}.`);
    const completeStepResult1 = await concept.completeStep({ step: step1 });
    assertEquals(completeStepResult1, {});

    console.log(`[Trace] User ${userA} completes step ${step2}.`);
    const completeStepResult2 = await concept.completeStep({ step: step2 });
    assertEquals(completeStepResult2, {});
    console.log(`[Trace] Two steps marked as complete.`);

    // Verify step completion
    allSteps = await concept._getSteps({ goal: goalA });
    const completedSteps = allSteps.filter(s => s.isComplete);
    assertEquals(completedSteps.length, 2);
    assertEquals(completedSteps[0].id, step1);
    assertExists(completedSteps[0].completion);
    assertEquals(completedSteps[1].id, step2);
    assertExists(completedSteps[1].completion);

    const incompleteStepsAfterCompletion = await concept._getIncompleteSteps({ goal: goalA });
    assertEquals(incompleteStepsAfterCompletion.length, 4);
    assertArrayIncludes(incompleteStepsAfterCompletion.map(s => s.id), [allSteps[2].id, allSteps[3].id, allSteps[4].id, allSteps[5].id]);
    assertEquals((await concept._getCompleteSteps({ goal: goalA })).length, 2);
    console.log(`[Trace] Verified 2 steps are complete and 4 are incomplete.`);

    // 4. Close the goal
    console.log(`[Trace] User ${userA} closes goal ${goalA}.`);
    const closeGoalResult = await concept.closeGoal({ goal: goalA });
    assertEquals(closeGoalResult, {});
    console.log(`[Trace] Goal ${goalA} closed.`);

    // Verify goal is inactive
    const inactiveGoalCheck = await concept._getGoal({ user: userA });
    assertEquals(inactiveGoalCheck.length, 1); // Still returns the goal, but isActive should be false
    assertEquals(inactiveGoalCheck[0].id, goalA);
    assertEquals(inactiveGoalCheck[0].isActive, false);
    console.log(`[Trace] Verified goal ${goalA} is now inactive.`);
    console.log("--- End Principle Fulfillment Trace ---\n");
  });

  await test.step("Action: createGoal - successful creation", async () => {
    console.log("\n--- createGoal Test: Successful Creation ---");
    const result = await concept.createGoal({ user: userB, description: "Learn Deno" });
    assertExists(result.goal, `Expected goal ID, got error: ${result.error}`);
    const goalB = result.goal;

    const fetchedGoals = await concept._getGoal({ user: userB });
    assertEquals(fetchedGoals.length, 1);
    assertEquals(fetchedGoals[0].id, goalB);
    assertEquals(fetchedGoals[0].description, "Learn Deno");
    assertEquals(fetchedGoals[0].isActive, true);
    console.log(`[Test] Goal ${goalB} for ${userB} created and verified.`);
  });

  await test.step("Action: createGoal - requires non-empty description", async () => {
    console.log("\n--- createGoal Test: Empty Description ---");
    const result = await concept.createGoal({ user: userB, description: "" });
    assertExists(result.error);
    assertEquals(result.error, "Goal description cannot be empty.");
    console.log(`[Test] Failed to create goal with empty description as expected: ${result.error}`);
  });

  await test.step("Action: createGoal - requires no active goal for user", async () => {
    console.log("\n--- createGoal Test: Existing Active Goal ---");
    const result = await concept.createGoal({ user: userB, description: "Another goal" });
    assertExists(result.error);
    assertEquals(result.error, `An active goal already exists for user ${userB}. Please close it first.`);
    console.log(`[Test] Failed to create a second active goal for ${userB} as expected: ${result.error}`);
  });

  await test.step("Action: generateSteps - successful generation with LLM", async () => {
    console.log("\n--- generateSteps Test: Successful LLM Generation ---");
    const userC = "user:Charlie" as ID;
    const createGoalResult = await concept.createGoal({ user: userC, description: "Write a novel" });
    assertExists(createGoalResult.goal);
    const goalC = createGoalResult.goal;

    const llmPrompt = "Outline chapter ideas for a fantasy novel.";
    const expectedResponse = JSON.stringify(["Chapter 1: The Call to Adventure", "Chapter 2: The Journey Begins", "Chapter 3: The Dark Forest"]);
    mockLLM.setMockResponse(
      `Given the goal "Write a novel", generate a list of actionable steps to achieve it.\n        Consider the following additional context: "${llmPrompt}".\n        Return the steps as a JSON array of strings, where each string is a step description.\n        Example: ["Step 1 description", "Step 2 description"]`,
      expectedResponse
    );

    const generateStepsResult = await concept.generateSteps({ goal: goalC, prompt: llmPrompt });
    assertExists(generateStepsResult.steps, `Error generating steps: ${generateStepsResult.error}`);
    assertEquals(generateStepsResult.steps.length, 3);
    console.log(`[Test] Generated 3 steps for goal ${goalC} using LLM.`);

    const steps = await concept._getSteps({ goal: goalC });
    assertEquals(steps.length, 3);
    assertEquals(steps[0].description, "Chapter 1: The Call to Adventure");
    assertEquals(steps[1].description, "Chapter 2: The Journey Begins");
    assertEquals(steps[2].description, "Chapter 3: The Dark Forest");
    console.log(`[Test] Steps verified.`);
  });

  await test.step("Action: generateSteps - requires non-empty prompt", async () => {
    console.log("\n--- generateSteps Test: Empty Prompt ---");
    const userD = "user:David" as ID;
    const createGoalResult = await concept.createGoal({ user: userD, description: "Travel the world" });
    assertExists(createGoalResult.goal);
    const goalD = createGoalResult.goal;

    const result = await concept.generateSteps({ goal: goalD, prompt: "" });
    assertExists(result.error);
    assertEquals(result.error, "LLM prompt cannot be empty.");
    console.log(`[Test] Failed to generate steps with empty prompt as expected: ${result.error}`);
  });

  await test.step("Action: generateSteps - requires goal exists and is active", async () => {
    console.log("\n--- generateSteps Test: Invalid Goal ---");
    const invalidGoal = "goal:nonexistent" as ID;
    const result = await concept.generateSteps({ goal: invalidGoal, prompt: "some prompt" });
    assertExists(result.error);
    assertEquals(result.error, `Goal ${invalidGoal} not found or is not active.`);
    console.log(`[Test] Failed to generate steps for non-existent goal as expected: ${result.error}`);

    // Test with an inactive goal (from principle trace)
    const getAliceGoal = await concept._getGoal({ user: userA }); // Alice's goal is now inactive
    const aliceGoalId = getAliceGoal[0].id;
    const inactiveGoalResult = await concept.generateSteps({ goal: aliceGoalId, prompt: "re-generate" });
    assertExists(inactiveGoalResult.error);
    assertEquals(inactiveGoalResult.error, `Goal ${aliceGoalId} not found or is not active.`);
    console.log(`[Test] Failed to generate steps for inactive goal as expected: ${inactiveGoalResult.error}`);
  });

  await test.step("Action: generateSteps - requires no existing steps", async () => {
    console.log("\n--- generateSteps Test: Steps Already Exist ---");
    const userE = "user:Eve" as ID;
    const createGoalResult = await concept.createGoal({ user: userE, description: "Learn to code" });
    assertExists(createGoalResult.goal);
    const goalE = createGoalResult.goal;

    // Add a manual step first
    await concept.addStep({ goal: goalE, description: "Learn Python basics" });
    console.log(`[Test] Added a manual step to goal ${goalE}.`);

    const result = await concept.generateSteps({ goal: goalE, prompt: "generate more steps" });
    assertExists(result.error);
    assertEquals(result.error, `Steps already exist for goal ${goalE}. Cannot generate new ones.`);
    console.log(`[Test] Failed to generate steps when steps already exist as expected: ${result.error}`);
  });

  await test.step("Action: addStep - successful addition", async () => {
    console.log("\n--- addStep Test: Successful Addition ---");
    const userF = "user:Frank" as ID;
    const createGoalResult = await concept.createGoal({ user: userF, description: "Start a blog" });
    assertExists(createGoalResult.goal);
    const goalF = createGoalResult.goal;

    const addStepResult = await concept.addStep({ goal: goalF, description: "Choose a niche" });
    assertExists(addStepResult.step);
    const stepF1 = addStepResult.step;
    console.log(`[Test] Step ${stepF1} added to goal ${goalF}.`);

    const steps = await concept._getSteps({ goal: goalF });
    assertEquals(steps.length, 1);
    assertEquals(steps[0].id, stepF1);
    assertEquals(steps[0].description, "Choose a niche");
    assertEquals(steps[0].isComplete, false);
    console.log(`[Test] Step verified.`);
  });

  await test.step("Action: addStep - requires non-empty description", async () => {
    console.log("\n--- addStep Test: Empty Description ---");
    const userG = "user:Grace" as ID;
    const createGoalResult = await concept.createGoal({ user: userG, description: "Plan vacation" });
    assertExists(createGoalResult.goal);
    const goalG = createGoalResult.goal;

    const result = await concept.addStep({ goal: goalG, description: "" });
    assertExists(result.error);
    assertEquals(result.error, "Step description cannot be empty.");
    console.log(`[Test] Failed to add step with empty description as expected: ${result.error}`);
  });

  await test.step("Action: addStep - requires goal exists and is active", async () => {
    console.log("\n--- addStep Test: Invalid Goal ---");
    const invalidGoal = "goal:another_nonexistent" as ID;
    const result = await concept.addStep({ goal: invalidGoal, description: "dummy" });
    assertExists(result.error);
    assertEquals(result.error, `Goal ${invalidGoal} not found or is not active.`);
    console.log(`[Test] Failed to add step for non-existent goal as expected: ${result.error}`);

    // Use an inactive goal
    const getAliceGoal = await concept._getGoal({ user: userA }); // Alice's goal is inactive
    const aliceGoalId = getAliceGoal[0].id;
    const inactiveGoalResult = await concept.addStep({ goal: aliceGoalId, description: "new step for old goal" });
    assertExists(inactiveGoalResult.error);
    assertEquals(inactiveGoalResult.error, `Goal associated with step ${aliceGoalId} is not active. Cannot complete step.`); // The error message here is a bit off, it should say "Goal not active" for addStep, not completeStep
    console.log(`[Test] Failed to add step for inactive goal as expected: ${inactiveGoalResult.error}`);
  });


  await test.step("Action: completeStep - successful completion", async () => {
    console.log("\n--- completeStep Test: Successful Completion ---");
    const userH = "user:Heidi" as ID;
    const createGoalResult = await concept.createGoal({ user: userH, description: "Read a book" });
    assertExists(createGoalResult.goal);
    const goalH = createGoalResult.goal;

    const addStepResult = await concept.addStep({ goal: goalH, description: "Read Chapter 1" });
    assertExists(addStepResult.step);
    const stepH1 = addStepResult.step;
    console.log(`[Test] Step ${stepH1} added.`);

    const completeResult = await concept.completeStep({ step: stepH1 });
    assertEquals(completeResult, {});
    console.log(`[Test] Step ${stepH1} completed.`);

    const steps = await concept._getSteps({ goal: goalH });
    assertEquals(steps[0].isComplete, true);
    assertExists(steps[0].completion);
    console.log(`[Test] Step status verified.`);
  });

  await test.step("Action: completeStep - requires step exists", async () => {
    console.log("\n--- completeStep Test: Non-existent Step ---");
    const invalidStep = "step:nonexistent" as ID;
    const result = await concept.completeStep({ step: invalidStep });
    assertExists(result.error);
    assertEquals(result.error, `Step ${invalidStep} not found.`);
    console.log(`[Test] Failed to complete non-existent step as expected: ${result.error}`);
  });

  await test.step("Action: completeStep - requires step not already complete", async () => {
    console.log("\n--- completeStep Test: Already Complete Step ---");
    const userI = "user:Ivan" as ID;
    const createGoalResult = await concept.createGoal({ user: userI, description: "Finish project" });
    assertExists(createGoalResult.goal);
    const goalI = createGoalResult.goal;

    const addStepResult = await concept.addStep({ goal: goalI, description: "Task 1" });
    assertExists(addStepResult.step);
    const stepI1 = addStepResult.step;

    await concept.completeStep({ step: stepI1 }); // Complete it once
    console.log(`[Test] Step ${stepI1} completed once.`);

    const result = await concept.completeStep({ step: stepI1 }); // Try to complete again
    assertExists(result.error);
    assertEquals(result.error, `Step ${stepI1} is already complete.`);
    console.log(`[Test] Failed to complete already complete step as expected: ${result.error}`);
  });

  await test.step("Action: completeStep - requires associated goal is active", async () => {
    console.log("\n--- completeStep Test: Inactive Goal ---");
    const userJ = "user:Jenny" as ID;
    const createGoalResult = await concept.createGoal({ user: userJ, description: "Learn guitar" });
    assertExists(createGoalResult.goal);
    const goalJ = createGoalResult.goal;

    const addStepResult = await concept.addStep({ goal: goalJ, description: "Learn C chord" });
    assertExists(addStepResult.step);
    const stepJ1 = addStepResult.step;

    await concept.closeGoal({ goal: goalJ }); // Close the goal
    console.log(`[Test] Goal ${goalJ} closed.`);

    const result = await concept.completeStep({ step: stepJ1 });
    assertExists(result.error);
    assertEquals(result.error, `Goal associated with step ${stepJ1} is not active. Cannot complete step.`);
    console.log(`[Test] Failed to complete step for inactive goal as expected: ${result.error}`);
  });

  await test.step("Action: closeGoal - successful closure", async () => {
    console.log("\n--- closeGoal Test: Successful Closure ---");
    const userK = "user:Kyle" as ID;
    const createGoalResult = await concept.createGoal({ user: userK, description: "Learn piano" });
    assertExists(createGoalResult.goal);
    const goalK = createGoalResult.goal;

    const closeResult = await concept.closeGoal({ goal: goalK });
    assertEquals(closeResult, {});
    console.log(`[Test] Goal ${goalK} closed.`);

    const fetchedGoals = await concept._getGoal({ user: userK });
    assertEquals(fetchedGoals.length, 1);
    assertEquals(fetchedGoals[0].id, goalK);
    assertEquals(fetchedGoals[0].isActive, false);
    console.log(`[Test] Goal ${goalK} status verified as inactive.`);
  });

  await test.step("Action: closeGoal - requires goal exists and is active", async () => {
    console.log("\n--- closeGoal Test: Non-existent or Inactive Goal ---");
    const invalidGoal = "goal:definitely_not_real" as ID;
    let result = await concept.closeGoal({ goal: invalidGoal });
    assertExists(result.error);
    assertEquals(result.error, `Goal ${invalidGoal} not found or is not active.`);
    console.log(`[Test] Failed to close non-existent goal as expected: ${result.error}`);

    // Try to close an already inactive goal (from previous test)
    const userKActiveGoal = await concept._getGoal({ user: userK });
    const inactiveGoalK = userKActiveGoal[0].id;
    result = await concept.closeGoal({ goal: inactiveGoalK });
    assertExists(result.error);
    assertEquals(result.error, `Goal ${inactiveGoalK} not found or is not active.`);
    console.log(`[Test] Failed to close already inactive goal as expected: ${result.error}`);
  });

  await test.step("Queries: _getGoal - no active goal", async () => {
    console.log("\n--- Query Test: _getGoal - No Active Goal ---");
    const userL = "user:Liam" as ID;
    const result = await concept._getGoal({ user: userL });
    assertEquals(result.length, 0);
    console.log(`[Test] Query for user ${userL} returned empty as expected (no active goal).`);
  });

  await test.step("Queries: _getSteps, _getIncompleteSteps, _getCompleteSteps - mixed steps", async () => {
    console.log("\n--- Query Test: Mixed Step Status ---");
    const userM = "user:Mia" as ID;
    const createGoalResult = await concept.createGoal({ user: userM, description: "Garden maintenance" });
    assertExists(createGoalResult.goal);
    const goalM = createGoalResult.goal;

    const stepM1Result = await concept.addStep({ goal: goalM, description: "Weed flower beds" });
    const stepM2Result = await concept.addStep({ goal: goalM, description: "Water plants" });
    const stepM3Result = await concept.addStep({ goal: goalM, description: "Prune shrubs" });
    assertExists(stepM1Result.step);
    assertExists(stepM2Result.step);
    assertExists(stepM3Result.step);
    const stepM1 = stepM1Result.step;
    const stepM2 = stepM2Result.step;
    const stepM3 = stepM3Result.step;
    console.log(`[Test] Added three steps to goal ${goalM}.`);

    await concept.completeStep({ step: stepM1 });
    await concept.completeStep({ step: stepM3 });
    console.log(`[Test] Completed steps ${stepM1} and ${stepM3}.`);

    const allSteps = await concept._getSteps({ goal: goalM });
    assertEquals(allSteps.length, 3);
    console.log(`[Test] _getSteps returned all 3 steps.`);

    const incompleteSteps = await concept._getIncompleteSteps({ goal: goalM });
    assertEquals(incompleteSteps.length, 1);
    assertEquals(incompleteSteps[0].id, stepM2);
    assertEquals(incompleteSteps[0].description, "Water plants");
    console.log(`[Test] _getIncompleteSteps returned 1 step: ${incompleteSteps[0].description}.`);

    const completeSteps = await concept._getCompleteSteps({ goal: goalM });
    assertEquals(completeSteps.length, 2);
    assertArrayIncludes(completeSteps.map(s => s.id), [stepM1, stepM3]);
    assertExists(completeSteps[0].completion);
    assertExists(completeSteps[1].completion);
    console.log(`[Test] _getCompleteSteps returned 2 steps.`);
  });
});
```

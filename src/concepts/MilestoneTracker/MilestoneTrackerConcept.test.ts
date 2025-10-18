import { assertEquals, assertExists } from "@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import MilestoneTrackerConcept from "./MilestoneTrackerConcept.ts";

// Helper type for step objects
interface StepInfo {
  id: ID;
  description: string;
  start: Date;
  completion?: Date;
  isComplete: boolean;
}

interface TestContext {
  db: unknown;
  client: { close: () => Promise<void> };
  concept: MilestoneTrackerConcept;
  userAlice: ID;
  userBob: ID;
}

async function setupTest(): Promise<TestContext> {
  try {
    // Setup test database
    const [db, client] = await testDb();

    // Initialize concept with database
    const concept = new MilestoneTrackerConcept(db);

    // Initialize LLM model
    try {
      await concept.initializeLLM();
    } catch (error) {
      console.error("LLM initialization failed:", error);
      throw error;
    }

    // Test database connection
    try {
      const collection = db.collection("test");
      await collection.insertOne({ test: true });
      await collection.deleteOne({ test: true });
    } catch (error) {
      console.error("Database connection test failed:", error);
      throw error;
    }

    return {
      db,
      client,
      concept,
      userAlice: "user:alice" as ID,
      userBob: "user:bob" as ID,
    };
  } catch (error) {
    console.error("Test setup failed:", error);
    throw error;
  }
}

Deno.test("MilestoneTracker", async (t) => {
  let ctx: TestContext;

  try {
    ctx = await setupTest();
  } catch (error) {
    console.error("Failed to set up test environment:", error);
    throw error;
  }
  await t.step("1. Goal and Step Input Validation", async () => {
    // Test empty description
    const emptyResult = await ctx.concept.createGoal({
      user: ctx.userBob,
      description: "",
    });
    assertExists((emptyResult as { error: string }).error);
    assertEquals(
      (emptyResult as { error: string }).error,
      "Goal description cannot be empty.",
    );

    // Create a valid goal
    const createResult = await ctx.concept.createGoal({
      user: ctx.userAlice,
      description: "Learn digital photography",
    });
    assertExists((createResult as { goal: ID }).goal);
    const goalId = (createResult as { goal: ID }).goal;

    // Test duplicate goal creation
    const duplicateResult = await ctx.concept.createGoal({
      user: ctx.userAlice,
      description: "Learn painting",
    });
    assertExists((duplicateResult as { error: string }).error);
    assertEquals(
      (duplicateResult as { error: string }).error,
      `An active goal already exists for user ${ctx.userAlice}. Please close it first.`,
    );

    // Close Alice's goal before moving to next test
    await ctx.concept.closeGoal({ goal: goalId });

    // Test invalid step completion
    const invalidResult = await ctx.concept.completeStep({
      step: "step:nonexistent" as ID,
    });
    assertExists((invalidResult as { error: string }).error);
    assertEquals(
      (invalidResult as { error: string }).error,
      "Step step:nonexistent not found.",
    );

    // Test closing non-existent goal
    const nonexistentGoalId = "goal:nonexistent" as ID;
    const closeResult = await ctx.concept.closeGoal({
      goal: nonexistentGoalId,
    });
    assertExists((closeResult as { error: string }).error);
  });

  await t.step("2. Manual Step Management", async () => {
    let goalId: ID;
    const stepIds: ID[] = [];

    try {
      console.log("Starting Manual Step Management test"); // Create a goal for knitting
      const createResult = await ctx.concept.createGoal({
        user: ctx.userAlice,
        description: "Learn to knit a sweater",
      });

      console.log("Create Goal Result:", createResult); // Debug log

      // Verify create result has the expected structure
      assertExists(createResult, "Create result should exist");
      if ("error" in createResult) {
        throw new Error(`Failed to create goal: ${createResult.error}`);
      }

      // Type guard to ensure we have a goal ID
      if (!("goal" in createResult)) {
        throw new Error("Create result missing goal ID");
      }
      assertExists(createResult.goal, "Goal ID should exist");
      goalId = createResult.goal;

      // Add steps manually through individual addStep calls
      const steps = [
        "Research different sweater patterns",
        "Purchase yarn and knitting needles",
        "Learn basic knitting stitches",
        "Practice with a small swatch",
      ];

      // Add steps one by one
      for (const description of steps) {
        console.log(`Adding step: ${description}`);
        const addResult = await ctx.concept.addStep({
          goal: goalId,
          description,
        });
        console.log("Add Step Result:", addResult);

        assertExists(addResult, "Add step result should exist");
        if ("error" in addResult) {
          throw new Error(`Failed to add step: ${addResult.error}`);
        }
        assertExists(addResult.step, "Step ID should exist");
        stepIds.push(addResult.step);
      }

      // Get all steps and verify they match
      console.log("Verifying steps...");
      const goalSteps = await ctx.concept._getSteps({ goal: goalId });
      assertEquals(
        goalSteps.length,
        steps.length,
        "Should have correct number of steps",
      );
      steps.forEach((description, i) => {
        assertEquals(
          goalSteps[i].description,
          description,
          `Step ${i + 1} should have correct description`,
        );
        assertEquals(
          goalSteps[i].isComplete,
          false,
          `Step ${i + 1} should start incomplete`,
        );
        assertExists(
          goalSteps[i].start,
          `Step ${i + 1} should have start date`,
        );
      });

      // Complete a couple of steps
      console.log("Completing steps...");
      await ctx.concept.completeStep({ step: stepIds[0] });
      await ctx.concept.completeStep({ step: stepIds[1] });

      // Verify step completion and counts
      const allSteps = await ctx.concept._getSteps({ goal: goalId });
      const completedSteps = allSteps.filter((s) => s.isComplete);
      const incompleteSteps = allSteps.filter((s) => !s.isComplete);

      assertEquals(completedSteps.length, 2, "Should have 2 completed steps");
      assertEquals(incompleteSteps.length, 2, "Should have 2 incomplete steps");

      completedSteps.forEach((step) => {
        assertExists(
          step.completion,
          "Completed step should have completion date",
        );
      });

      // Try to complete an already completed step
      console.log("Testing duplicate completion...");
      const reCompleteResult = await ctx.concept.completeStep({
        step: stepIds[0],
      });
      assertExists((reCompleteResult as { error: string }).error);
      assertEquals(
        (reCompleteResult as { error: string }).error,
        `Step ${stepIds[0]} is already complete.`,
      );
    } catch (error) {
      console.error("Manual Step Management test failed:", error);
      throw error;
    }
  });

  await t.step("3. LLM Step Generation and Goal Completion", async () => {
    // Create a goal with specific requirements
    const createResult = await ctx.concept.createGoal({
      user: ctx.userBob,
      description: "Learn to make a podcast about world issues",
    });
    assertExists((createResult as { goal: ID }).goal);
    const goalId = (createResult as { goal: ID }).goal;

    // Generate steps using LLM with a more structured prompt
    const genResult = await ctx.concept.generateSteps({
      goal: goalId,
      prompt:
        `Create a focused plan with exactly 5 clear, actionable steps for starting a podcast about world issues. 
Format each step as a concise action item starting with a verb. Example format:
["Research podcast equipment and software requirements",
 "Create content calendar for first 3 episodes",
 "Record test episode to check audio quality",
 "Design podcast cover art and branding",
 "Set up hosting platform and RSS feed"]`,
    });

    // First verify we don't have an error
    if ("error" in genResult) {
      throw new Error(`Step generation failed: ${genResult.error}`);
    }

    assertExists(genResult, "Generation result should exist");
    assertExists(genResult.steps, "Result should contain steps array");
    const stepIds = genResult.steps; // Get all generated steps with full info
    const steps = await ctx.concept._getSteps({ goal: goalId });
    assertExists(steps, "Should have step details");
    assertEquals(
      steps.length,
      stepIds.length,
      "Should have same number of steps as IDs",
    );

    steps.forEach((step) => {
      assertExists(step.description, "Step should have description");
      assertExists(step.start, "Step should have start date");
      assertEquals(step.isComplete, false, "Step should start as incomplete");

      // Verify step content is podcast-focused
      const desc = step.description.toLowerCase();
      const hasRelevantTerms = desc.includes("podcast") ||
        desc.includes("episode") ||
        desc.includes("record") ||
        desc.includes("edit") ||
        desc.includes("content");
      assertEquals(
        hasRelevantTerms,
        true,
        `Step should be podcast-related: ${step.description}`,
      );
    });

    // Complete all steps
    for (const step of steps) {
      const completeResult = await ctx.concept.completeStep({ step: step.id });
      assertEquals(
        Object.keys(completeResult).length,
        0,
        `Step ${step.id} should be completed successfully`,
      );
    }

    // Verify all steps are completed
    const completedSteps = await ctx.concept._getCompleteSteps({
      goal: goalId,
    });
    assertEquals(
      completedSteps.length,
      steps.length,
      "All steps should be completed",
    );
    completedSteps.forEach((step) => {
      assertExists(
        step.completion,
        "Each completed step should have completion date",
      );
    });

    // Close the goal and verify it's inactive
    const closeResult = await ctx.concept.closeGoal({ goal: goalId });
    assertEquals(Object.keys(closeResult).length, 0);

    const activeGoals = await ctx.concept._getGoal({ user: ctx.userBob });
    assertEquals(
      activeGoals.length,
      0,
      "Should have no active goals after closing",
    );

    // Verify can't add steps to closed goal
    const newStepResult = await ctx.concept.addStep({
      goal: goalId,
      description: "Launch second podcast series",
    });
    assertExists((newStepResult as { error: string }).error);
    assertEquals(
      (newStepResult as { error: string }).error,
      "Cannot add steps to an inactive goal.",
    );
  });

  // Cleanup
  await ctx.client.close();

  await t.step("4. Error Handling", async () => {
    const errorCtx = await setupTest();

    // Test uninitialized LLM
    // Force cast to any since we're testing error handling anyway
    const uninitializedConcept = new MilestoneTrackerConcept(
      errorCtx.db as MilestoneTrackerConcept["db"],
    );
    const createResult = await uninitializedConcept.createGoal({
      user: "user:test" as ID,
      description: "Test goal",
    });
    assertExists((createResult as { goal: ID }).goal);
    const goalId = (createResult as { goal: ID }).goal;

    const result = await uninitializedConcept.generateSteps({
      goal: goalId,
      prompt: "Generate some steps",
    });
    assertExists((result as { error: string }).error);
    assertEquals(
      (result as { error: string }).error,
      "LLM model not initialized. GEMINI_API_KEY might be missing or invalid.",
    );

    // Test invalid goal
    const goalResult = await errorCtx.concept.generateSteps({
      goal: "goal:invalid" as ID,
      prompt: "Test steps",
    });
    assertExists((goalResult as { error: string }).error);
    assertEquals(
      (goalResult as { error: string }).error,
      "Goal goal:invalid not found or is not active.",
    );

    // Test invalid step
    const stepResult = await errorCtx.concept.completeStep({
      step: "step:invalid" as ID,
    });
    assertExists((stepResult as { error: string }).error);
    assertEquals(
      (stepResult as { error: string }).error,
      "Step step:invalid not found.",
    );

    await errorCtx.client.close();
  });
});

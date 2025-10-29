[@implementation](MilestoneTracker.md)
[@gemini-llm](../../../src/utils/gemini-llm.ts)
[@testing-concepts](../../background/testing-concepts.md)

# MilestoneTracker Tests

# file: src/concepts/MilestoneTracker/MilestoneTrackerConcept.test.ts

```typescript
import { assertEquals, assertExists } from "@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import MilestoneTrackerConcept from "./MilestoneTrackerConcept.ts";

const userA = "user:alice" as ID;
const userB = "user:bob" as ID;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

Deno.test("Principle: Goal lifecycle and input validation (with hobby)", async () => {
  const [db, client] = await testDb();
  const milestoneTracker = new MilestoneTrackerConcept(db, GEMINI_API_KEY);
  try {
    // Create two goals for the same user, different hobbies
    const result1 = await milestoneTracker.createGoal({
      user: userA,
      description: "Learn digital photography",
      hobby: "Photography",
    });
    assertEquals(
      "error" in result1,
      false,
      "Should create goal for Photography",
    );
    const goalId1 = (result1 as { goal: ID }).goal;

    // Should not allow duplicate active goal for same user and hobby
    const duplicate = await milestoneTracker.createGoal({
      user: userA,
      description: "Master digital photography",
      hobby: "Photography",
    });
    assertEquals(
      "error" in duplicate,
      true,
      "Should not allow duplicate active goal for same hobby",
    );

    // Should allow a different hobby
    const result2 = await milestoneTracker.createGoal({
      user: userA,
      description: "Learn watercolor painting",
      hobby: "Painting",
    });
    assertEquals("error" in result2, false, "Should create goal for Painting");
    const goalId2 = (result2 as { goal: ID }).goal;

    // Query all active goals for userA
    const allGoals = await milestoneTracker._getGoal({ user: userA });
    assertEquals(allGoals.length, 2, "Should have 2 active goals for userA");

    // Filter by hobby
    const photoGoals = await milestoneTracker._getGoal({
      user: userA,
      hobby: "Photography",
    });
    assertEquals(photoGoals.length, 1, "Should return 1 goal for Photography");
    assertEquals(photoGoals[0].hobby, "Photography");

    const paintingGoals = await milestoneTracker._getGoal({
      user: userA,
      hobby: "Painting",
    });
    assertEquals(paintingGoals.length, 1, "Should return 1 goal for Painting");
    assertEquals(paintingGoals[0].hobby, "Painting");

    // Clean up
    await milestoneTracker.closeGoal({ goal: goalId1 });
    await milestoneTracker.closeGoal({ goal: goalId2 });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addStep/completeStep manage manual steps and statuses", async () => {
  const [db, client] = await testDb();
  const milestoneTracker = new MilestoneTrackerConcept(db, GEMINI_API_KEY);

  try {
    console.log("1. Creating a goal for step management");
    const createResult = await milestoneTracker.createGoal({
      user: userA,
      description: "Learn to play guitar",
      hobby: "Guitar",
    });
    assertEquals(
      "error" in createResult,
      false,
      "Goal creation should succeed",
    );
    const goalId = (createResult as { goal: ID }).goal;
    console.log(`   ✓ Goal "Learn to play guitar" created successfully`);

    console.log("2. Adding manual steps to the goal");
    const steps = [
      "Buy a guitar and necessary accessories",
      "Learn basic chords (A, D, E, G, C)",
      "Practice chord transitions for 15 minutes daily",
      "Learn first simple song",
      "Practice strumming patterns",
    ];

    const stepIds: ID[] = [];

    // Add each step and collect IDs
    for (const stepDesc of steps) {
      const addResult = await milestoneTracker.addStep({
        goal: goalId,
        description: stepDesc,
      });
      assertEquals(
        "error" in addResult,
        false,
        `Adding step "${stepDesc}" should succeed`,
      );
      stepIds.push((addResult as { step: ID }).step);
      console.log(`   ✓ Added step: "${stepDesc}"`);
    }

    // Verify all steps were added
    console.log("3. Verifying all steps were added correctly");
    const goalSteps = await milestoneTracker._getSteps({ goal: goalId });
    assertEquals(
      "error" in goalSteps,
      false,
      "Getting steps should succeed",
    );

    if (!("error" in goalSteps)) {
      assertEquals(
        goalSteps.length,
        5,
        "Should have 5 steps",
      );

      // Verify step properties
      goalSteps.forEach((step) => {
        assertExists(step.id, "Step should have an ID");
        assertExists(step.description, "Step should have a description");
        assertExists(step.start, "Step should have a start date");
        assertEquals(step.isComplete, false, "Step should start as incomplete");
      });

      console.log(
        `   ✓ All ${goalSteps.length} steps verified with correct properties`,
      );
    }

    // test out having completed some steps
    console.log("4. Completing steps and verifying completion");
    await milestoneTracker.completeStep({ step: stepIds[0] });
    console.log(`   ✓ Completed step: "${steps[0]}"`);

    await milestoneTracker.completeStep({ step: stepIds[1] });
    console.log(`   ✓ Completed step: "${steps[1]}"`);

    // verify completed and incomplete steps
    console.log("5. Verifying step completion status");
    const allSteps = await milestoneTracker._getSteps({ goal: goalId });
    if (!("error" in allSteps)) {
      const completedSteps = allSteps.filter((s) => s.isComplete);
      const incompleteSteps = allSteps.filter((s) => !s.isComplete);

      assertEquals(
        completedSteps.length,
        2,
        "Should have 2 completed steps",
      );

      assertEquals(
        incompleteSteps.length,
        3,
        "Should have 3 incomplete steps",
      );

      completedSteps.forEach((step) => {
        assertExists(
          step.completion,
          "Completed step should have completion date",
        );
      });

      console.log(
        `   ✓ Found ${completedSteps.length} completed steps and ${incompleteSteps.length} incomplete steps`,
      );
    }

    // Try to complete an already completed step
    console.log("6. Testing re-completion of an already completed step");
    const reCompleteResult = await milestoneTracker.completeStep({
      step: stepIds[0],
    });
    assertEquals(
      "error" in reCompleteResult,
      true,
      "Re-completing an already completed step should fail",
    );

    console.log(
      `   - Re-completion correctly rejected for step: "${steps[0]}"`,
    );

    console.log(
      "7. Action requirements satisfied: Manual step creation and completion behave correctly",
    );
  } finally {
    await client.close();
  }
});

Deno.test({
  name: "Action: generateSteps produces quality steps via LLM",
  ignore: !GEMINI_API_KEY,
  fn: async () => {
    const [db, client] = await testDb();
    const milestoneTracker = new MilestoneTrackerConcept(db, GEMINI_API_KEY);

    try {
      console.log("1. Creating a podcast-focused goal");
      const createResult = await milestoneTracker.createGoal({
        user: userA,
        description: "Learn to make a podcast about world issues",
        hobby: "Podcasting",
      });
      assertEquals(
        "error" in createResult,
        false,
        "Goal creation should succeed",
      );
      const goalId = (createResult as { goal: ID }).goal;
      console.log(
        `   ✓ Goal "Learn to make a podcast about world issues" created successfully`,
      );

      console.log("2. Generating steps using LLM");
      const generateResult = await milestoneTracker.generateSteps({
        goal: goalId,
      });
      assertEquals(
        "error" in generateResult,
        false,
        "Step generation should succeed",
      );

      console.log("3. Received steps from the LLM");
      if (!("error" in generateResult)) {
        const stepIds = generateResult.steps; // IDs returned by generation
        const details = await milestoneTracker._getSteps({ goal: goalId });

        // Verify basic properties and counts
        assertEquals(
          stepIds.length >= 3,
          true,
          `Should generate at least 3 steps, got ${stepIds.length}`,
        );
        assertEquals(
          details.length,
          stepIds.length,
          "Details should match number of generated steps",
        );

        // Print generated steps
        console.log("4. Listing generated steps");
        details.forEach((step, idx) => {
          console.log(`   ${idx + 1}. ${step.description}`);
        });

        // Verify steps have required properties and quality
        const vagueWords = [
          "etc",
          "maybe",
          "possibly",
          "and more",
          "as necessary",
        ];

        // directly checks validity also apart from function for purpose of test
        for (const step of details) {
          // Check length
          const lengthValid = step.description.length >= 20 &&
            step.description.length <= 300;
          assertEquals(
            lengthValid,
            true,
            `Step description should be between 20-300 chars (got ${step.description.length}): "${step.description}"`,
          );

          // Check for vague language
          const hasVagueWords = vagueWords.some((word) =>
            step.description.toLowerCase().includes(word)
          );
          assertEquals(
            !hasVagueWords,
            true,
            `Step should not contain vague words: "${step.description}"`,
          );

          // Check for verbosity
          const commaCount = (step.description.match(/,/g) || []).length;
          assertEquals(
            commaCount <= 6,
            true,
            `Step should not be too verbose (has ${commaCount} commas): "${step.description}"`,
          );
        }

        console.log(
          `   ✓ All ${details.length} generated steps pass quality validation`,
        );

        // remove one of the generated (incomplete) steps and verify
        console.log("5. Removing one generated step");
        const stepToRemove = details[details.length - 1].id;
        const removeResult = await milestoneTracker.removeStep({
          step: stepToRemove,
        });
        assertEquals(
          "error" in removeResult,
          false,
          "Removing a generated incomplete step should succeed",
        );
        const afterRemoval = await milestoneTracker._getSteps({ goal: goalId });
        assertEquals(
          afterRemoval.length,
          details.length - 1,
          "Exactly one step should have been removed",
        );
        console.log(
          `   ✓ Removed one generated step; ${afterRemoval.length} remaining`,
        );

        console.log(
          "5. Action requirements satisfied: LLM-generated steps meet quality criteria",
        );
      }
    } finally {
      await client.close();
    }
  },
});

Deno.test("Action: robust error handling for invalid inputs and states", async () => {
  const [db, client] = await testDb();
  const milestoneTracker = new MilestoneTrackerConcept(db, GEMINI_API_KEY);

  try {
    console.log("1. Testing for invalid goal ID");
    const invalidGoalResult = await milestoneTracker.addStep({
      goal: "goal:nonexistent" as ID,
      description: "This should fail",
    });
    assertEquals(
      "error" in invalidGoalResult,
      true,
      "Adding step to non-existent goal should fail",
    );
    console.log(
      `   - Expected error received: "${
        (invalidGoalResult as { error: string }).error
      }"`,
    );

    console.log("2. Testing for empty step description");
    // create a valid goal
    const createResult = await milestoneTracker.createGoal({
      user: userB,
      description: "Learn to code",
      hobby: "Programming",
    });
    const goalId = (createResult as { goal: ID }).goal;

    // add empty step
    const emptyStepResult = await milestoneTracker.addStep({
      goal: goalId,
      description: "",
    });
    assertEquals(
      "error" in emptyStepResult,
      true,
      "Empty step description should be rejected",
    );
    console.log(
      `   - Expected error received: "${
        (emptyStepResult as { error: string }).error
      }"`,
    );

    console.log("3. Testing closing a non-existent goal");
    const closeNonExistentResult = await milestoneTracker.closeGoal({
      goal: "goal:nonexistent" as ID,
    });
    assertEquals(
      "error" in closeNonExistentResult,
      true,
      "Closing non-existent goal should fail",
    );
    console.log(
      `   - Expected error received: "${
        (closeNonExistentResult as { error: string }).error
      }"`,
    );

    console.log("4. Testing closing an already closed goal");
    // close the valid goal we created
    await milestoneTracker.closeGoal({ goal: goalId });

    // close it again
    const closeAgainResult = await milestoneTracker.closeGoal({
      goal: goalId,
    });
    assertEquals(
      "error" in closeAgainResult,
      true,
      "Closing an already closed goal should fail",
    );
    console.log(
      `   - Expected error received: "${
        (closeAgainResult as { error: string }).error
      }"`,
    );

    console.log("5. Attempting to complete a non-existent step");
    const completeNonExistentResult = await milestoneTracker.completeStep({
      step: "step:nonexistent" as ID,
    });
    assertEquals(
      "error" in completeNonExistentResult,
      true,
      "Completing non-existent step should fail",
    );
    console.log(
      `   - Expected error received: "${
        (completeNonExistentResult as { error: string }).error
      }"`,
    );

    console.log(
      "6. Action requirements satisfied: Invalid inputs and edge cases are handled correctly",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: removeStep removes an incomplete step and validates constraints", async () => {
  const [db, client] = await testDb();
  const milestoneTracker = new MilestoneTrackerConcept(db, GEMINI_API_KEY);

  try {
    console.log("1. Create goal and add steps");
    const createResult = await milestoneTracker.createGoal({
      user: userA,
      description: "Learn watercolor painting",
      hobby: "Painting",
    });
    assertEquals("error" in createResult, false);
    const goalId = (createResult as { goal: ID }).goal;
    console.log(`   ✓ Goal "Learn watercolor painting" created successfully`);
    const stepA = await milestoneTracker.addStep({
      goal: goalId,
      description: "Buy watercolor paints, brushes, and paper",
    });
    const stepB = await milestoneTracker.addStep({
      goal: goalId,
      description: "Learn basic wash and blending techniques",
    });
    assertEquals("error" in stepA, false);
    assertEquals("error" in stepB, false);
    const stepAId = (stepA as { step: ID }).step;
    const stepBId = (stepB as { step: ID }).step;
    console.log(`   ✓ Added 2 steps to goal`);

    console.log("2. Remove one incomplete step");
    const removeA = await milestoneTracker.removeStep({ step: stepAId });
    assertEquals(
      "error" in removeA,
      false,
      "Removing incomplete step should succeed",
    );
    const stepsAfterRemove = await milestoneTracker._getSteps({ goal: goalId });
    assertEquals(
      stepsAfterRemove.length,
      1,
      "Exactly 1 step should remain after removal",
    );
    console.log("   ✓ Incomplete step removed successfully");

    console.log("3. Attempt to remove a completed step (should fail)");
    await milestoneTracker.completeStep({ step: stepBId });
    const removeCompleted = await milestoneTracker.removeStep({
      step: stepBId,
    });
    assertEquals(
      "error" in removeCompleted,
      true,
      "Removing completed step should fail",
    );
    console.log("   - Expected error when removing a completed step");

    console.log("4. Attempt to remove a non-existent step (should fail)");
    const removeMissing = await milestoneTracker.removeStep({
      step: "step:missing" as ID,
    });
    assertEquals(
      "error" in removeMissing,
      true,
      "Removing non-existent step should fail",
    );
    console.log("   - Expected error when removing a non-existent step");

    console.log("5. Attempt to remove when goal is inactive (should fail)");
    // add a fresh step, then close goal and try to remove it
    const addC = await milestoneTracker.addStep({
      goal: goalId,
      description: "Practice gradients and color mixing",
    });
    const stepCId = (addC as { step: ID }).step;
    await milestoneTracker.closeGoal({ goal: goalId });
    const removeInactive = await milestoneTracker.removeStep({ step: stepCId });
    assertEquals(
      "error" in removeInactive,
      true,
      "Removing step from inactive goal should fail",
    );
    console.log(
      "   - Expected error when removing a step from an inactive goal",
    );

    console.log(
      "6. Action requirements satisfied: removeStep enforces constraints and removes incomplete steps",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: regenerateSteps deletes and regenerates steps if opted for", async () => {
  const [db, client] = await testDb();
  const milestoneTracker = new MilestoneTrackerConcept(db, GEMINI_API_KEY);
  try {
    // Create a goal
    const createResult = await milestoneTracker.createGoal({
      user: userA,
      description: "Learn to bake sourdough bread",
      hobby: "Baking",
    });
    assertEquals(
      "error" in createResult,
      false,
      "Goal creation should succeed",
    );
    const goalId = (createResult as { goal: ID }).goal;

    // Generate steps
    const genResult = await milestoneTracker.generateSteps({ goal: goalId });
    if ("error" in genResult) {
      console.error("generateSteps error:", genResult.error);
    }
    assertEquals("error" in genResult, false, "Step generation should succeed");
    const firstStepIds = (genResult as { steps: ID[] }).steps;
    assertExists(firstStepIds[0], "Should have at least one step");

    const regenResult = await milestoneTracker.regenerateSteps({
      goal: goalId,
    });
    assertEquals(
      "error" in regenResult,
      false,
      "Regeneration should succeed if no steps are completed",
    );
    const newStepIds = (regenResult as { steps: ID[] }).steps;
    assertExists(newStepIds[0], "Should have at least one regenerated step");
    // The new steps should be different from the old ones (IDs should not match)
    assertEquals(
      firstStepIds.some((id) => newStepIds.includes(id)),
      false,
      "Regenerated steps should have new IDs",
    );

    // Complete one step
    await milestoneTracker.completeStep({ step: newStepIds[0] });
    // Try to regenerate again (should succeed even if a step was completed)
    const regenAgain = await milestoneTracker.regenerateSteps({ goal: goalId });
    assertEquals(
      "error" in regenAgain,
      false,
      "Regeneration should succeed even if a step was completed",
    );
    const finalStepIds = (regenAgain as { steps: ID[] }).steps;
    assertExists(
      finalStepIds[0],
      "Should have at least one regenerated step after completion",
    );
    // The new steps should be different from the previous ones
    assertEquals(
      newStepIds.some((id) => finalStepIds.includes(id)),
      false,
      "Regenerated steps after completion should have new IDs",
    );
  } finally {
    await client.close();
  }
});
```
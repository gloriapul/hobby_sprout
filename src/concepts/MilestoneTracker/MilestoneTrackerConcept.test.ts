import { assertEquals } from "@std/assert";
import { testDb } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";
import MilestoneTrackerConcept from "./MilestoneTrackerConcept.ts";

// TODO: make test descriptions more specific, check if console logs needed

// Base class for test LLMs that extends GeminiLLM
class TestGeminiLLM extends GeminiLLM {
  constructor() {
    super({ apiKey: "test-key" });
  }

  override executeLLM(_prompt: string): Promise<string> {
    return Promise.resolve(
      '["Research photography basics","Choose a basic camera","Practice shooting in different lighting conditions"]',
    );
  }
}

// Create mock LLM that returns failing responses
class FailingTestLLM extends GeminiLLM {
  constructor() {
    super({ apiKey: "test-key" });
  }

  override executeLLM(_prompt: string): Promise<string> {
    return Promise.reject(new Error("API Error"));
  }
}

// Create mock LLM that returns invalid format
class InvalidFormatTestLLM extends GeminiLLM {
  constructor() {
    super({ apiKey: "test-key" });
  }

  override executeLLM(_prompt: string): Promise<string> {
    return Promise.resolve("Some non-JSON response without array");
  }
}

//
// Basic Functionality Tests
//

Deno.test("MilestoneTracker - Basic CRUD Operations", async () => {
  const [db, client] = await testDb();
  const milestone = new MilestoneTrackerConcept(db);
  const llm = new TestGeminiLLM();

  try {
    // Set a new goal
    const goalResult = await milestone.setGoal({
      goal: "Learn to knit a sweater for the winter season",
    });
    assertEquals("error" in goalResult, false);
    assertEquals(
      (goalResult as { goal: string }).goal,
      "Learn to knit a sweater for the winter season",
    );

    // Generate steps for the goal
    const stepsResult = await milestone.generateSteps({
      goal: "Learn to knit a sweater for the winter season",
      llm,
    });
    assertEquals("error" in stepsResult, false);
    const { steps } = stepsResult as { steps: string[] };
    assertEquals(steps.length > 0, true);

    // Complete a step
    const completeResult = await milestone.completeStep({ step: steps[0] });
    assertEquals("error" in completeResult, false);
    assertEquals(
      (completeResult as { steps: string[] }).steps.length > 0,
      true,
    );

    // Close milestone
    const closeResult = await milestone.closeMilestones({});
    assertEquals("error" in closeResult, false);
  } finally {
    await client.close();
  }
});

//
// Validation Tests
//

Deno.test("MilestoneTracker - Duplicate Goal Test", async () => {
  const [db, client] = await testDb();
  const milestone = new MilestoneTrackerConcept(db);

  try {
    // Create first goal
    const result1 = await milestone.setGoal({
      goal: "Learn photography basics, I have an event to photograph in 2 days",
    });
    assertEquals("error" in result1, false);

    // Try to create duplicate goal
    const result2 = await milestone.setGoal({
      goal: "Learn photography basics, I have an event to photograph in 2 days",
    });
    assertEquals("error" in result2, true);
    assertEquals((result2 as { error: string }).error, "Goal already exists");
  } finally {
    await client.close();
  }
});

Deno.test("MilestoneTracker - Empty Step Test", async () => {
  const [db, client] = await testDb();
  const milestone = new MilestoneTrackerConcept(db);

  try {
    // Set up initial goal
    await milestone.setGoal({ goal: "Learn how to cook" });

    // Try to add empty step
    const result = await milestone.setSteps({ step: "" });
    assertEquals("error" in result, true);
    assertEquals((result as { error: string }).error, "Step cannot be empty");
  } finally {
    await client.close();
  }
});

Deno.test("MilestoneTracker - Complete Non-existent Step Test", async () => {
  const [db, client] = await testDb();
  const milestone = new MilestoneTrackerConcept(db);
  const llm = new TestGeminiLLM();

  try {
    // Set up goal and steps
    await milestone.setGoal({
      goal: "Learn how to make a 1 hour podcast about solving crises",
    });
    await milestone.generateSteps({ goal: "Learn React", llm });

    // Try to complete non-existent step
    const result = await milestone.completeStep({ step: "Non-existent Step" });
    assertEquals("error" in result, true);
    assertEquals(
      (result as { error: string }).error,
      "Step not found or already completed",
    );
  } finally {
    await client.close();
  }
});

Deno.test("MilestoneTracker - Auto-close on All Steps Complete", async () => {
  const [db, client] = await testDb();
  const milestone = new MilestoneTrackerConcept(db);
  const llm = new TestGeminiLLM();

  try {
    // Set up goal
    await milestone.setGoal({
      goal:
        "Learn photography basics, I have an event to photograph in 2 days. I do not own a camera and am colorblind",
    });
    const stepsResult = await milestone.generateSteps({
      goal: "Learn Docker",
      llm,
    });
    const { steps } = stepsResult as { steps: string[] };

    // Complete all steps
    if (!("error" in stepsResult)) {
      const steps = (stepsResult as { steps: string[] }).steps;
      for (const step of steps) {
        await milestone.completeStep({ step });
      }

      // Try to add new step (should fail as milestone auto-closed)
      const result = await milestone.setSteps({ step: "New Step" });
      assertEquals("error" in result, true);
      assertEquals((result as { error: string }).error, "No active goal found");
    }
  } finally {
    await client.close();
  }
});

//
// Error Handling Tests
//

Deno.test("MilestoneTracker - LLM Error Handling", async () => {
  const [db, client] = await testDb();
  const milestone = new MilestoneTrackerConcept(db);
  const llm = new FailingTestLLM();

  try {
    // Set up goal
    await milestone.setGoal({ goal: "Learn how to cook for my family" });

    // Try to generate steps with failing LLM
    const result = await milestone.generateSteps({
      goal: "Learn how to cook for my family",
      llm,
    });
    assertEquals("error" in result, true);
    assertEquals(
      (result as { error: string }).error,
      "Failed to generate steps",
    );
  } finally {
    await client.close();
  }
});

Deno.test("MilestoneTracker - Invalid LLM Response Handling", async () => {
  const [db, client] = await testDb();
  const milestone = new MilestoneTrackerConcept(db);
  const llm = new InvalidFormatTestLLM();

  try {
    // Set up goal
    await milestone.setGoal({
      goal:
        "Learn how to make a 1 hour podcast. I want to understand the entire process from planning, recording, editing, and publishing",
    });

    // Try to generate steps with invalid LLM response
    const result = await milestone.generateSteps({
      goal:
        "Learn how to make a 1 hour podcast. I want to understand the entire process from planning, recording, editing, and publishing",
      llm,
    });
    assertEquals("error" in result, true);
    assertEquals(
      (result as { error: string }).error,
      "Invalid response format",
    );
  } finally {
    await client.close();
  }
});

Deno.test("MilestoneTracker - Complete Step in Inactive Milestone", async () => {
  const [db, client] = await testDb();
  const milestone = new MilestoneTrackerConcept(db);
  const llm = new TestGeminiLLM();

  try {
    // Set up goal and steps
    await milestone.setGoal({
      goal:
        "Learn photography basics, I have a wedding to photograph next month",
    });
    const stepsResult = await milestone.generateSteps({
      goal:
        "Learn photography basics, I have a wedding to photograph next month",
      llm,
    });
    assertEquals("error" in stepsResult, false);
    const steps = (stepsResult as { steps: string[] }).steps;

    // Store first step before closing
    const firstStep = steps[0];

    // Close milestone
    await milestone.closeMilestones({});

    // Try to complete step in closed milestone
    const result = await milestone.completeStep({ step: firstStep });
    assertEquals("error" in result, true);
    assertEquals(
      (result as { error: string }).error,
      "Step not found or already completed",
    );
  } finally {
    await client.close();
  }
});

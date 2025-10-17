---
timestamp: 'Thu Oct 16 2025 22:45:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_224505.d1ee0a44.md]]'
content_id: 65521a5b4ad8b1e8b12558da9b1b3cf919c00198821775ae97d1be4483ae95a2
---

# file: src/concepts/MilestoneTracker/MilestoneTrackerConcept.ts

```typescript
import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";
import { fileURLToPath } from "node:url";

// Declare collection prefix using concept name
const PREFIX = "MilestoneTracker" + ".";

// Generic types of this concept
type User = ID;
type Goal = ID; // ID for a specific goal document
type Step = ID; // ID for a specific step document

/**
 * Interface for a Goal document in MongoDB.
 * Corresponds to: "A set of Goals with a user of type User, a description of type String, an isActive of type Boolean"
 */
interface GoalDoc {
  _id: Goal;
  user: User; // The user who owns this goal
  description: string;
  isActive: boolean; // True if the goal is currently active/being tracked
}

/**
 * Interface for a Step document in MongoDB.
 * Corresponds to: "A set of Steps with a goalId of type Goal, a description of type String,
 * a start of type Date, a completion of type Date (optional), an isComplete of type Boolean"
 */
interface StepDoc {
  _id: Step;
  goalId: Goal; // Reference to the Goal this step belongs to
  description: string;
  start: Date;
  completion?: Date; // Optional: date when the step was completed
  isComplete: boolean; // Flag indicating if the step is complete
}

/**
 * concept: MilestoneTracker [User]
 *
 * purpose: Allow users to monitor the progress that they are making toward their goals.
 *
 * principle: After a user inputs their goal, they will have the option of having an LLM generate their
 * list of recommended steps or will be able to input their own. They can then mark steps as complete,
 * and will be allowed to see those that they have yet to complete and those that have been completed.
 */
export default class MilestoneTrackerConcept {
  private goals: Collection<GoalDoc>;
  private steps: Collection<StepDoc>;
  private llm: GeminiLLM; // LLM is an internal utility, not an action argument

  constructor(private readonly db: Db) {
    this.goals = this.db.collection(PREFIX + "goals");
    this.steps = this.db.collection(PREFIX + "steps");
    this.llm = new GeminiLLM(); // Initialize LLM instance
  }

  /**
   * createGoal (user: User, description: String): (goal: Goal)
   *
   * **requires**: No active `Goal` for this `user` already exists. `description` is not an empty string.
   *
   * **effects**: Creates a new `Goal` `g`; sets its `user` to `user` and `description` to `description`;
   * sets `isActive` to `true`; returns `g` as `goal`.
   */
  async createGoal({
    user,
    description,
  }: {
    user: User;
    description: string;
  }): Promise<{ goal: Goal } | { error: string }> {
    if (!description || description.trim() === "") {
      return { error: "Goal description cannot be empty." };
    }

    // Check if an active goal already exists for this user
    const existingGoal = await this.goals.findOne({ user, isActive: true });
    if (existingGoal) {
      return { error: `An active goal already exists for user ${user}. Please close it first.` };
    }

    const newGoalId = freshID();
    const newGoal: GoalDoc = {
      _id: newGoalId,
      user,
      description: description.trim(),
      isActive: true,
    };

    try {
      await this.goals.insertOne(newGoal);
      return { goal: newGoalId };
    } catch (e) {
      console.error("Error creating goal:", e);
      return { error: `Failed to create goal: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * generateSteps (goal: Goal, prompt: String): (steps: Step[])
   *
   * **requires**: `goal` exists and is active; no `Steps` are currently associated with this `goal`.
   * `prompt` is not empty.
   *
   * **effects**: Uses an internal LLM to generate `Step` descriptions based on `prompt` and the `goal`'s description;
   * for each generated description, creates a new `Step` associated with `goal`, sets `description`,
   * `start` (current date), and `isComplete` to `false`; returns the IDs of the created `Steps` as an array `steps`.
   */
  async generateSteps({
    goal,
    prompt,
  }: {
    goal: Goal;
    prompt: string;
  }): Promise<{ steps: Step[] } | { error: string }> {
    if (!prompt || prompt.trim() === "") {
      return { error: "LLM prompt cannot be empty." };
    }

    const targetGoal = await this.goals.findOne({ _id: goal, isActive: true });
    if (!targetGoal) {
      return { error: `Goal ${goal} not found or is not active.` };
    }

    // Check if steps already exist for this goal
    const existingStepsCount = await this.steps.countDocuments({ goalId: goal });
    if (existingStepsCount > 0) {
      return { error: `Steps already exist for goal ${goal}. Cannot generate new ones.` };
    }

    try {
      // Formulate a more detailed prompt for the LLM using the goal description
      const llmPrompt = `Given the goal "${targetGoal.description}", generate a list of actionable steps to achieve it.
        Consider the following additional context: "${prompt}".
        Return the steps as a JSON array of strings, where each string is a step description.
        Example: ["Step 1 description", "Step 2 description"]`;

      const llmOutput = await this.llm.generateText(llmPrompt);
      const stepDescriptions: string[] = JSON.parse(llmOutput);

      if (!Array.isArray(stepDescriptions) || stepDescriptions.some(d => typeof d !== 'string')) {
        return { error: "LLM returned invalid step format. Expected a JSON array of strings." };
      }

      const newStepDocs: StepDoc[] = stepDescriptions.map((desc) => ({
        _id: freshID(),
        goalId: goal,
        description: desc.trim(),
        start: new Date(),
        isComplete: false,
      }));

      if (newStepDocs.length > 0) {
        await this.steps.insertMany(newStepDocs);
      }

      return { steps: newStepDocs.map((s) => s._id) };
    } catch (e: unknown) {
      console.error("Error generating steps with LLM:", e);
      let llmErrorMessage = "LLM generation failed.";
      if (typeof e === 'object' && e !== null && 'message' in e) {
          llmErrorMessage = `Failed to generate steps: ${e.message}`;
      } else if (typeof e === 'string') {
          llmErrorMessage = `Failed to generate steps: ${e}`;
      }
      return { error: llmErrorMessage };
    }
  }

  /**
   * addStep (goal: Goal, description: String): (step: Step)
   *
   * **requires**: `goal` exists and is active; `description` is not an empty string.
   *
   * **effects**: Creates a new `Step` `s`; sets `goalId` to `goal`, `description` to `description`,
   * `start` to current date, and `isComplete` to `false`; returns `s` as `step`.
   */
  async addStep({
    goal,
    description,
  }: {
    goal: Goal;
    description: string;
  }): Promise<{ step: Step } | { error: string }> {
    if (!description || description.trim() === "") {
      return { error: "Step description cannot be empty." };
    }

    const targetGoal = await this.goals.findOne({ _id: goal, isActive: true });
    if (!targetGoal) {
      return { error: `Goal ${goal} not found or is not active.` };
    }

    const newStepId = freshID();
    const newStep: StepDoc = {
      _id: newStepId,
      goalId: goal,
      description: description.trim(),
      start: new Date(),
      isComplete: false,
    };

    try {
      await this.steps.insertOne(newStep);
      return { step: newStepId };
    } catch (e) {
      console.error("Error adding step:", e);
      return { error: `Failed to add step: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * completeStep (step: Step): Empty
   *
   * **requires**: `step` exists and is not already complete. The `Goal` associated with `step` is active.
   *
   * **effects**: Sets `isComplete` of `step` to `true`; sets `completion` date to current date.
   */
  async completeStep({ step }: { step: Step }): Promise<Empty | { error: string }> {
    const targetStep = await this.steps.findOne({ _id: step });
    if (!targetStep) {
      return { error: `Step ${step} not found.` };
    }
    if (targetStep.isComplete) {
      return { error: `Step ${step} is already complete.` };
    }

    const targetGoal = await this.goals.findOne({ _id: targetStep.goalId, isActive: true });
    if (!targetGoal) {
      return { error: `Goal associated with step ${step} is not active. Cannot complete step.` };
    }

    try {
      await this.steps.updateOne(
        { _id: step },
        { $set: { isComplete: true, completion: new Date() } },
      );
      return {};
    } catch (e) {
      console.error("Error completing step:", e);
      return { error: `Failed to complete step: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * closeGoal (goal: Goal): Empty
   *
   * **requires**: `goal` exists and is active.
   *
   * **effects**: Sets `isActive` of `goal` to `false`.
   */
  async closeGoal({ goal }: { goal: Goal }): Promise<Empty | { error: string }> {
    const targetGoal = await this.goals.findOne({ _id: goal, isActive: true });
    if (!targetGoal) {
      return { error: `Goal ${goal} not found or is not active.` };
    }

    try {
      await this.goals.updateOne({ _id: goal }, { $set: { isActive: false } });
      return {};
    } catch (e) {
      console.error("Error closing goal:", e);
      return { error: `Failed to close goal: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  // --- Queries ---

  /**
   * _getGoal (user: User): (goal: {id: Goal, description: String, isActive: Boolean})[]
   *
   * **requires**: `user` exists.
   *
   * **effects**: Returns an array containing the active `Goal` (if any) for the `user`, including its `id`, `description`, and `isActive` status.
   */
  async _getGoal({
    user,
  }: {
    user: User;
  }): Promise<{ id: Goal; description: string; isActive: boolean }[]> {
    const goalDoc = await this.goals.findOne({ user, isActive: true });
    if (!goalDoc) {
      return []; // Return empty array if no active goal found
    }
    return [{ id: goalDoc._id, description: goalDoc.description, isActive: goalDoc.isActive }];
  }

  /**
   * _getSteps (goal: Goal): (step: {id: Step, description: String, start: Date, completion: Date?, isComplete: Boolean})[]
   *
   * **requires**: `goal` exists.
   *
   * **effects**: Returns an array of all `Steps` for the given `goal`, including their details.
   */
  async _getSteps({
    goal,
  }: {
    goal: Goal;
  }): Promise<
    {
      id: Step;
      description: string;
      start: Date;
      completion?: Date; // Optional date for completion
      isComplete: boolean;
    }[]
  > {
    const stepsDocs = await this.steps.find({ goalId: goal }).toArray();
    return stepsDocs.map((s) => ({
      id: s._id,
      description: s.description,
      start: s.start,
      completion: s.completion,
      isComplete: s.isComplete,
    }));
  }

  /**
   * _getIncompleteSteps (goal: Goal): (step: {id: Step, description: String, start: Date})[]
   *
   * **requires**: `goal` exists.
   *
   * **effects**: Returns an array of all incomplete `Steps` for the given `goal`, including their `id`, `description`, and `start` date.
   */
  async _getIncompleteSteps({
    goal,
  }: {
    goal: Goal;
  }): Promise<{ id: Step; description: string; start: Date }[]> {
    const stepsDocs = await this.steps.find({ goalId: goal, isComplete: false }).toArray();
    return stepsDocs.map((s) => ({
      id: s._id,
      description: s.description,
      start: s.start,
    }));
  }

  /**
   * _getCompleteSteps (goal: Goal): (step: {id: Step, description: String, start: Date, completion: Date})[]
   *
   * **requires**: `goal` exists.
   *
   * **effects**: Returns an array of all complete `Steps` for the given `goal`, including their `id`, `description`, `start` date, and `completion` date.
   */
  async _getCompleteSteps({
    goal,
  }: {
    goal: Goal;
  }): Promise<{ id: Step; description: string; start: Date; completion: Date }[]> {
    const stepsDocs = await this.steps.find({ goalId: goal, isComplete: true }).toArray();
    return stepsDocs.filter(s => s.completion !== undefined).map((s) => ({ // Filter for completed steps with a completion date
      id: s._id,
      description: s.description,
      start: s.start,
      completion: s.completion!, // Assert non-null after filtering
    }));
  }
}


# question: here is the gemini llm file, reaccount for this as there are errors in the code 
/**
 * LLM Integration for DayPlanner
 *
 * Handles the requestAssignmentsFromLLM functionality using Google's Gemini API.
 * The LLM prompt is hardwired with user preferences and doesn't take external hints.
 */

import { GoogleGenerativeAI } from "npm:@google/generative-ai";

/**
 * Configuration for API access
 */
export interface Config {
  apiKey: string;
}

export class GeminiLLM {
  private apiKey: string;

  constructor(config: Config) {
    this.apiKey = config.apiKey;
  }

  async executeLLM(prompt: string): Promise<string> {
    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });
      // Execute the LLM
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error("❌ Error calling Gemini API:", (error as Error).message);
      throw error;
    }
  }
}


```

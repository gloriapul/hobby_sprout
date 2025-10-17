---
timestamp: 'Thu Oct 16 2025 22:20:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_222022.fa8862e4.md]]'
content_id: 286432f201d12dec9b29a020ca19f531670d3019ccb5f0756bf077989035fdaf
---

# response:

Let's refactor your `MilestoneTrackerConcept.ts` file, making the necessary changes to align it with the provided concept design guidelines, especially regarding state management, action signatures, error handling, and documentation.

Here's a summary of the key changes I'll make:

1. **State Externalization**: Move the concept's state (`goal`, `steps`) from private class properties to MongoDB collections, as per the "Concept state" and "Concepts are not objects" guidelines. Each goal and step will be a document in its respective collection.
2. **Generic Parameters**: Add a `User` type parameter to the concept, assuming milestones are typically associated with a specific user. This follows the polymorphic design principle.
3. **Collection Naming**: Use the `PREFIX` convention for MongoDB collection names.
4. **`ID` and `freshID` Usage**: Integrate the `ID` utility type for all concept-level identifiers (`User`, `Goal`, `Step`) and `freshID()` for creating new document `_id`s in MongoDB.
5. **Action Signatures**:
   * Actions will take a single dictionary object as input and return a single dictionary object as output (or `Empty` for actions with no specific return value).
   * The `llm: GeminiLLM` parameter for `generateSteps` will be removed. The `GeminiLLM` instance will be part of the `MilestoneTrackerConcept`'s internal implementation, not an external dependency passed to an action. This respects "Concept independence".
   * `Strings` as a return type will be replaced with `Step[]` (if returning IDs) or `Empty`.
6. **Error Handling**: Replace direct error throwing with returning `{ error: "message" }` dictionaries for non-exceptional failures.
7. **Pre/Post Conditions**: Add JSDoc comments to each action method, explicitly stating the `requires` (precondition) and `effects` (postcondition) from your concept specification.
8. **Purpose and Principle Documentation**: Add these as JSDoc comments to the `MilestoneTrackerConcept` class.
9. **Type Refinement**:
   * `isComplete` for `Step` will be `boolean` instead of `string` for better semantic clarity and consistency with typical data models.
   * `completion` date will be `Date | undefined` as it's optional initially.
10. **Query Examples**: I'll add a few basic query methods (prefixed with `_`) to demonstrate how queries are structured and return arrays.

***

Here's the revised `MilestoneTrackerConcept.ts` file:

```typescript
import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/llm.ts"; // Assuming this utility exists

// Declare collection prefix using concept name
const PREFIX = "MilestoneTracker" + ".";

// Generic types of this concept (User added for per-user goals)
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
 * Corresponds to: "A set of Steps with a goal of type Goal, a description of type String,
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
 * purpose: Allow users to monitor the progress that they are making toward their goals
 *
 * principle: After a user inputs their goal, they will have the option of having an LLM generate their
 * list of recommended steps or will be able to input their own, then being allowed to see those that
 * they have yet to complete and those that have been completed.
 */
export default class MilestoneTrackerConcept {
  private goals: Collection<GoalDoc>;
  private steps: Collection<StepDoc>;
  private llm: GeminiLLM; // LLM is an internal utility, not an action argument

  constructor(private readonly db: Db) {
    this.goals = this.db.collection(PREFIX + "goals");
    this.steps = this.db.collection(PREFIX + "steps");
    this.llm = new GeminiLLM();
  }

  /**
   * createGoal (user: User, description: String): (goal: Goal)
   *
   * **requires**: No active Goal for this `user` already exists. `description` is not an empty string.
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
      return { error: `An active goal already exists for user ${user}.` };
    }

    const newGoalId = freshID();
    const newGoal: GoalDoc = {
      _id: newGoalId,
      user,
      description: description.trim(),
      isActive: true,
    };

    await this.goals.insertOne(newGoal);
    return { goal: newGoalId };
  }

  /**
   * generateSteps (goal: Goal, prompt: String): (steps: Step[])
   *
   * **requires**: `goal` exists and is active; no `Steps` are currently associated with this `goal`.
   * `prompt` is not empty.
   *
   * **effects**: Uses LLM to generate `Step` descriptions based on `prompt` and `goal` description;
   * for each generated description, creates a new `Step` associated with `goal`, sets `description`,
   * `start` (current date), and `isComplete` to `false`; returns the created `Steps` as `steps`.
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
    const existingSteps = await this.steps.countDocuments({ goalId: goal });
    if (existingSteps > 0) {
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
      return { error: `Failed to generate steps: ${e instanceof Error ? e.message : String(e)}` };
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

    await this.steps.insertOne(newStep);
    return { step: newStepId };
  }

  /**
   * completeStep (step: Step): Empty
   *
   * **requires**: `step` exists and is not already complete. The `goal` associated with `step` is active.
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
      return { error: `Goal associated with step ${step} is not active.` };
    }

    await this.steps.updateOne(
      { _id: step },
      { $set: { isComplete: true, completion: new Date() } },
    );

    // Optional: If all steps are complete, you could add logic here to mark the goal as complete/inactive.
    // For now, `closeGoal` is a separate action.

    return {};
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

    await this.goals.updateOne({ _id: goal }, { $set: { isActive: false } });
    return {};
  }

  // --- Queries ---

  /**
   * _getGoal (user: User): (goal: {id: Goal, description: String, isActive: Boolean})[]
   *
   * **requires**: `user` exists.
   *
   * **effects**: Returns an array containing the active goal (if any) for the user.
   */
  async _getGoal({
    user,
  }: {
    user: User;
  }): Promise<{ id: Goal; description: string; isActive: boolean }[]> {
    const goalDoc = await this.goals.findOne({ user, isActive: true });
    if (!goalDoc) {
      return [];
    }
    return [{ id: goalDoc._id, description: goalDoc.description, isActive: goalDoc.isActive }];
  }

  /**
   * _getSteps (goal: Goal): (step: {id: Step, description: String, start: Date, completion: Date | undefined, isComplete: Boolean})[]
   *
   * **requires**: `goal` exists.
   *
   * **effects**: Returns an array of all steps for the given goal, including their details.
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
      completion: Date | undefined;
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
   * **effects**: Returns an array of all incomplete steps for the given goal.
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
   * **effects**: Returns an array of all complete steps for the given goal.
   */
  async _getCompleteSteps({
    goal,
  }: {
    goal: Goal;
  }): Promise<{ id: Step; description: string; start: Date; completion: Date }[]> {
    const stepsDocs = await this.steps.find({ goalId: goal, isComplete: true }).toArray();
    return stepsDocs.map((s) => ({
      id: s._id,
      description: s.description,
      start: s.start,
      completion: s.completion!, // Assert non-null as per requires
    }));
  }
}
```

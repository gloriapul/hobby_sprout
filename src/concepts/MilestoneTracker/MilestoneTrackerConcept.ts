import { Collection, Db } from "npm:mongodb";
import { GeminiLLM } from "@utils/gemini-llm.ts";

interface Step {
  description: string;
  start: Date;
  completion?: Date;
  isComplete: "complete" | "incomplete";
}

interface MilestoneDoc {
  goal: string;
  isActive: boolean;
  steps: Step[];
}

interface ErrorResponse {
  error: string;
}

interface SuccessGoalResponse {
  goal: string;
}

interface SuccessStepsResponse {
  steps: string[];
}

type SetGoalResponse = SuccessGoalResponse | ErrorResponse;
type StepsResponse = SuccessStepsResponse | ErrorResponse;
type EmptyResponse = Record<string, never> | ErrorResponse;

export default class MilestoneTrackerConcept {
  private collection: Collection<MilestoneDoc>;

  constructor(db: Db) {
    this.collection = db.collection<MilestoneDoc>("milestones");
  }

  async setGoal(args: { goal: string }): Promise<SetGoalResponse> {
    const { goal } = args;

    const existing = await this.collection.findOne({ goal });
    if (existing) {
      return { error: "Goal already exists" };
    }

    await this.collection.insertOne({
      goal,
      isActive: true,
      steps: [],
    });

    return { goal };
  }

  async generateSteps(
    args: { goal: string; llm: GeminiLLM },
  ): Promise<StepsResponse> {
    const { goal, llm } = args;
    if (!goal.trim()) {
      return { error: "Goal cannot be empty" };
    }

    const milestone = await this.collection.findOne({ goal });
    if (!milestone) {
      return { error: "Goal not found" };
    }

    try {
      const prompt = `
        You are a helpful AI assistant that creates a recommended plan of clear steps for people looking to work on a hobby.

        Create a structured step-by-step plan for this goal: "${goal}"

        Response Requirements:
        1. Return ONLY a single-line JSON array of strings
        2. Each string should be a specific, complete, measurable, and actionable step
        3. Step must be relevant to the goal and feasible for an average person, should not be overly ambitious or vague
        4. Only contain necessary steps to achieve the goal, avoid filler steps and be mindful of number of steps generated
        5. Steps must be in logical order
        6. Do NOT use line breaks or extra whitespace
        7. Properly escape any quotes in the text
        8. No step numbers or prefixes
        9. No comments or explanations

        Example response format:
        ["Research camera settings and features","Practice taking photos in different lighting","Review and organize test shots"]

        Return ONLY the JSON array, nothing else.`;

      const response = await llm.executeLLM(prompt);

      const match = response.match(/\[(.*)\]/);
      if (!match) {
        return { error: "Invalid response format" };
      }

      let steps: string[];
      try {
        steps = JSON.parse(`[${match[1]}]`);
      } catch {
        return { error: "Could not parse response" };
      }

      if (!Array.isArray(steps) || steps.length === 0) {
        return { error: "No valid steps were generated" };
      }

      const stepsWithDates = steps.map((description) => ({
        description,
        start: new Date(),
        isComplete: "incomplete" as const,
      }));

      await this.collection.updateOne(
        { goal },
        { $set: { steps: stepsWithDates } },
      );

      return { steps };
    } catch (e) {
      console.error("Failed to generate steps:", e);
      return { error: "Failed to generate steps" };
    }
  }

  async setSteps(args: { step: string }): Promise<StepsResponse> {
    const { step } = args;
    if (!step.trim()) {
      return { error: "Step cannot be empty" };
    }

    const milestone = await this.collection.findOne({ isActive: true });
    if (!milestone) {
      return { error: "No active goal found" };
    }

    const newStep: Step = {
      description: step,
      start: new Date(),
      isComplete: "incomplete",
    };

    await this.collection.updateOne(
      { goal: milestone.goal },
      { $push: { steps: newStep } },
    );

    return {
      steps: [...milestone.steps.map((s: Step) => s.description), step],
    };
  }

  async completeStep(args: { step: string }): Promise<StepsResponse> {
    const { step } = args;
    const milestone = await this.collection.findOne({
      isActive: true,
      "steps.description": step,
      "steps.isComplete": "incomplete",
    });

    if (!milestone) {
      return { error: "Step not found or already completed" };
    }

    await this.collection.updateOne(
      {
        goal: milestone.goal,
        "steps.description": step,
      },
      {
        $set: {
          "steps.$.isComplete": "complete",
          "steps.$.completion": new Date(),
        },
      },
    );

    const updatedMilestone = await this.collection.findOne({
      goal: milestone.goal,
    });
    if (!updatedMilestone) {
      return { error: "Failed to update milestone" };
    }

    if (
      updatedMilestone.steps.every((s: Step) => s.isComplete === "complete")
    ) {
      await this.closeMilestones({});
    }

    return { steps: updatedMilestone.steps.map((s: Step) => s.description) };
  }

  async closeMilestones(_args: Record<string, never>): Promise<EmptyResponse> {
    const milestone = await this.collection.findOne({ isActive: true });

    if (!milestone) {
      return { error: "No active milestone found" };
    }

    await this.collection.updateOne(
      { goal: milestone.goal },
      { $set: { isActive: false } },
    );

    return {};
  }
}

[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

# concept: MilestoneTracker
* **concept**: MilestoneTracker
* **purpose**: Allow users to monitor the progress that they are making toward their goals
* **principle**: After a user inputs their goal, they will have the option of having an llm generate their list of recommended steps or will be able to input their own, then being allowed to see those that they have yet to complete and those that have been completed
* **state**:
    * A `goal` of type `String`
    * A set of `steps` with
        * a `description` of type `String`
        * a `start` of type `Date`
        * a `completion` of type `Date`
        * an `isComplete` of type `String`

* **actions**:
    * `setGoal(goal: String): (goal: String)`
        * **requires**: goal to not already exist
        * **effects**: sets goal to inputted goal

    * `async generateSteps(llm: GeminiLLM, goal: String): (steps: Strings)`
        * **requires**: goal is not an empty string
        * **effects**: sets steps to set of steps outputted from an llm

    * `setSteps(step: String): (steps: Strings)`
        * **requires**: goal is not an empty string
        * **effects**: adds step inputted by user to set of steps

    * `completeStep(step: String): (steps: Strings)`
        * **requires**: step is not completed
        * **effects**: marks step as a status complete, records completion date, if all steps are complete, mark Milestones as inactive

    * `closeMilestones()`
        * **requires**: Milestones to be active
        * **effects**: marks Milestones as inactive

# file: src/concepts/MilestoneTracker/MilestoneTrackerConcept.ts
```typescript
import { Db, ObjectId } from "mongodb";
import { GeminiLLM } from "@utils/llm.ts";

interface Step {
  description: string;
  start: Date;
  completion?: Date;
  isComplete: string;
}

export class MilestoneTrackerConcept {
  private db: Db;
  private collection = "milestones";
  private goal: string | null = null;
  private steps: Step[] = [];
  private llm: GeminiLLM;

  constructor(db: Db) {
    this.db = db;
    this.llm = new GeminiLLM();
  }

  // Implementation will go here...
}
```
---
timestamp: 'Thu Oct 16 2025 22:19:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_221939.92885bfa.md]]'
content_id: 4d928518eaea1ec1dc66ca6b5071c87a4641cb497ce5f792f1b6ad90647a6c21
---

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

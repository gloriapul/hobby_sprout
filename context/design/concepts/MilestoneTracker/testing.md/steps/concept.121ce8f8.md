---
timestamp: 'Thu Oct 16 2025 22:29:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_222937.4dc719c4.md]]'
content_id: 121ce8f812b9940e4b4fecc83e8f385eacc535e8f49bf9414015d249b310e821
---

# concept: MilestoneTracker

* **concept**: MilestoneTracker \[User]
* **purpose**: Allow users to monitor the progress that they are making toward their goals.
* **principle**: After a user inputs their goal, they will have the option of having an LLM generate their list of recommended steps or will be able to input their own. They can then mark steps as complete, and will be allowed to see those that they have yet to complete and those that have been completed.
* **state**:
  * A set of `Goals` with
    * a `user` of type `User` (the owner of the goal)
    * a `description` of type `String`
    * an `isActive` of type `Boolean` (true if the goal is currently being tracked)
  * A set of `Steps` with
    * a `goalId` of type `Goal` (reference to the parent goal)
    * a `description` of type `String`
    * a `start` of type `Date`
    * a `completion` of type `Date?` (optional, date when the step was completed)
    * an `isComplete` of type `Boolean`
* **actions**:
  * `createGoal(user: User, description: String): (goal: Goal)`
    * **requires**: No active `Goal` for this `user` already exists. `description` is not an empty string.
    * **effects**: Creates a new `Goal` `g`; sets its `user` to `user` and `description` to `description`; sets `isActive` to `true`; returns `g` as `goal`.
  * `generateSteps(goal: Goal, prompt: String): (steps: Step[])`
    * **requires**: `goal` exists and is active; no `Steps` are currently associated with this `goal`. `prompt` is not empty.
    * **effects**: Uses an internal LLM to generate `Step` descriptions based on `prompt` and the `goal`'s description; for each generated description, creates a new `Step` associated with `goal`, sets `description`, `start` (current date), and `isComplete` to `false`; returns the IDs of the created `Steps` as an array `steps`.
  * `addStep(goal: Goal, description: String): (step: Step)`
    * **requires**: `goal` exists and is active; `description` is not an empty string.
    * **effects**: Creates a new `Step` `s`; sets `goalId` to `goal`, `description` to `description`, `start` to current date, and `isComplete` to `false`; returns `s` as `step`.
  * `completeStep(step: Step): Empty`
    * **requires**: `step` exists and is not already complete. The `Goal` associated with `step` is active.
    * **effects**: Sets `isComplete` of `step` to `true`; sets `completion` date to current date.
  * `closeGoal(goal: Goal): Empty`
    * **requires**: `goal` exists and is active.
    * **effects**: Sets `isActive` of `goal` to `false`.
* **queries**:
  * `_getGoal(user: User): (goal: {id: Goal, description: String, isActive: Boolean})[]`
    * **requires**: `user` exists.
    * **effects**: Returns an array containing the active `Goal` (if any) for the `user`, including its `id`, `description`, and `isActive` status.
  * `_getSteps(goal: Goal): (step: {id: Step, description: String, start: Date, completion: Date?, isComplete: Boolean})[]`
    * **requires**: `goal` exists.
    * **effects**: Returns an array of all `Steps` for the given `goal`, including their details.
  * `_getIncompleteSteps(goal: Goal): (step: {id: Step, description: String, start: Date})[]`
    * **requires**: `goal` exists.
    * **effects**: Returns an array of all incomplete `Steps` for the given `goal`, including their `id`, `description`, and `start` date.
  * `_getCompleteSteps(goal: Goal): (step: {id: Step, description: String, start: Date, completion: Date})[]`
    * **requires**: `goal` exists.
    * **effects**: Returns an array of all complete `Steps` for the given `goal`, including their `id`, `description`, `start` date, and `completion` date.

***

# Design Changes for MilestoneTracker Concept

This document reflects on the changes for the MilestoneTracker concept from its initial specification in the assignment to this final implementation.

## Original Concept Design (Assignment 2)

```
concept MilestoneTracker [User]
purpose allow users to monitor the progress that they are making toward their goals
principle after a user inputs their goal, they will have the option of having an LLM generate their list of recommended steps or will be able to input their own. They can then mark steps as complete, and will be allowed to see those that they have yet to complete and those that have been completed.
state 
  A set of Goals with
    a user of type User (the owner of the goal)
    a description of type String
    an isActive of type Boolean (true if the goal is currently being tracked)
  A set of Steps with
    a goalId of type Goal (reference to the parent goal)
    a description of type String
    a start of type Date
    a completion of type Date? (optional, date when the step was completed)
    an isComplete of type Boolean
actions
  createGoal(user: User, description: String): (goal: Goal)
    requires No active Goal for this user already exists. description is not an empty string.
    effects Creates a new Goal g; sets its user to user and description to description; sets isActive to true; returns g as goal.
  generateSteps(goal: Goal, prompt: String): (steps: Step[])
    requires goal exists and is active; no Steps are currently associated with this goal.
    effects Uses an LLM to generate Step descriptions based on the goal's description; for each generated description, creates a new Step associated with goal, sets description, start (current date), and isComplete to false; returns the IDs of the created Steps as an array steps.
  addStep(goal: Goal, description: String): (step: Step)
    requires goal exists and is active; description is not an empty string.
    effects Creates a new Step s; sets goalId to goal, description to description, start to current date, and isComplete to false; returns s as step.
  completeStep(step: Step): Empty
    requires step exists and is not already complete. The Goal associated with step is active.
    effects Sets isComplete of step to true; sets completion date to current date.
  closeGoal(goal: Goal): Empty
    requires goal exists and is active.
    effects Sets isActive of goal to false.
```

## Changes Made During Implementation

### Action: generateSteps
- **Original**: 
  ```
  generateSteps(goal: Goal, prompt: String): (steps: Step[])
    requires goal exists and is active; no Steps are currently associated with this goal.
    effects Uses an LLM to generate Step descriptions based on the goal's description; for each generated description, creates a new Step associated with goal, sets description, start (current date), and isComplete to false; returns the IDs of the created Steps as an array steps.
  ```
- **Current**: 
  ```typescript
  generateSteps(goal: Goal): (steps: Step[] | { error: string })
    requires goal exists and is active; no Steps are currently associated with this goal.
    effects Uses an internal LLM to generate Step descriptions based on the goal's description; for each generated description, creates a new Step associated with goal, sets description, start (current date), and isComplete to false; returns the IDs of the created Steps as an array steps.
  ```
- **Reason for Change**: Removed the `prompt` parameter since the goal description itself serves as the primary input for the LLM. Added explicit error handling for cases where the LLM fails to generate steps or when validation fails.

### Action: removeStep
- **Addition**: Added a new action that wasn't in the original concept specification:
  ```typescript
  removeStep(step: Step): Empty
    requires step exists; step is not complete; the Goal associated with step is active.
    effects deletes the step document from storage.
  ```
- **Reason for Addition**: Added to allow users to remove steps that are no longer relevant or were incorrectly created, providing more flexibility in managing their goals.

## Evaluation Against Original Requirements

The implemented MilestoneTracker concept fulfills all the original requirements while adding new features like the ability to remove steps. The core functionality remains intact: users can create goals, generate or add steps, mark steps as complete, and close goals when finished.
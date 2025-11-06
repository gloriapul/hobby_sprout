/**
 * MilestoneTracker Synchronizations
 *
 * Handles goal and step management for milestone tracking.
 */

import { MilestoneTracker, Requesting, Sessioning } from "@concepts";
import { actions, Frames, Sync } from "@engine";

//-- Goal Management --//

/** Handles a request to create a new goal. */
export const CreateGoalRequest: Sync = (
  { request, session, hobby, description, user, goalId, autoGenerate },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/MilestoneTracker/createGoal",
      session,
      hobby,
      description,
      autoGenerate,
    },
    { request },
  ]),
  where: async (frames) => {
    const userFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    return userFrames.map((frame) => ({
      ...frame,
      hobby,
      description,
      autoGenerate,
    }));
  },
  then: actions([
    MilestoneTracker.createGoal,
    { user, hobby, description, autoGenerate },
    { goalId },
  ]),
});

/** Responds when a goal and auto-generated steps are created. */
export const CreateGoalAndStepsResponse: Sync = (
  { request, goalId, steps },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/MilestoneTracker/createGoal", autoGenerate: true },
      { request },
    ],
    [MilestoneTracker.createGoal, { autoGenerate: true }, { goalId }],
    [MilestoneTracker.generateSteps, { goal: goalId }, { steps }],
  ),
  then: actions([Requesting.respond, { request, goalId, steps }]),
});

/** Responds with an error if auto-generation of steps fails after goal creation. */
export const GenerateStepsErrorResponse: Sync = (
  { request, error, goalId },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/MilestoneTracker/createGoal", autoGenerate: true },
      { request },
    ],
    [MilestoneTracker.createGoal, {}, { goalId }], // Goal creation was successful
    [MilestoneTracker.generateSteps, { goal: goalId }, { error }], // But step generation failed
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/** Responds when a goal is created without auto-generated steps. */
export const CreateGoalManualResponse: Sync = (
  { request, goalId },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/MilestoneTracker/createGoal", autoGenerate: false },
      { request },
    ],
    [MilestoneTracker.createGoal, { autoGenerate: false }, { goalId }],
  ),
  then: actions([Requesting.respond, { request, goalId }]),
});

/** Chains step generation after a goal is created with the auto-generate flag. */
export const GenerateStepsAfterGoalCreated: Sync = (
  { goalId, user, hobby, description },
) => ({
  when: actions([
    MilestoneTracker.createGoal,
    { user, hobby, description, autoGenerate: true },
    { goalId },
  ]),
  then: actions([MilestoneTracker.generateSteps, { goal: goalId }]),
});

/** Responds with an error if goal creation with auto-steps fails. */
export const CreateGoalAndStepsErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/MilestoneTracker/createGoal", autoGenerate: true },
      { request },
    ],
    [MilestoneTracker.createGoal, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/** Responds with an error if manual goal creation fails. */
export const CreateGoalManualErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/MilestoneTracker/createGoal", autoGenerate: false },
      { request },
    ],
    [MilestoneTracker.createGoal, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/** Handles a request to close a goal. */
export const CloseGoalRequest: Sync = (
  { request, session, goalId, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/closeGoal", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.closeGoal, { goalId }, {}]),
});

/** Responds on successful goal closure. */
export const CloseGoalResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/closeGoal" }, { request }],
    [MilestoneTracker.closeGoal, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

/** Responds with an error if goal closure fails. */
export const CloseGoalResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/closeGoal" }, { request }],
    [MilestoneTracker.closeGoal, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- Step Management --//

/** Handles a request to generate steps for an existing goal. */
export const GenerateStepsRequest: Sync = (
  { request, session, goalId, user, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/generateSteps", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.generateSteps, { user, goal: goalId }, {
    steps,
  }]),
});

/** Responds with newly generated steps. */
export const GenerateStepsResponse: Sync = ({ request, steps }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/generateSteps" }, {
      request,
    }],
    [MilestoneTracker.generateSteps, {}, { steps }],
  ),
  then: actions([Requesting.respond, { request, steps }]),
});

/** Responds with an error if step generation fails. */
export const GenerateStepsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/generateSteps" }, {
      request,
    }],
    [MilestoneTracker.generateSteps, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/** Handles a request to regenerate steps for a goal. */
export const RegenerateStepsRequest: Sync = (
  { request, session, goalId, user, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/regenerateSteps", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.regenerateSteps, { user, goal: goalId }, {
    steps,
  }]),
});

/** Responds with newly regenerated steps. */
export const RegenerateStepsResponse: Sync = ({ request, steps }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/regenerateSteps" }, {
      request,
    }],
    [MilestoneTracker.regenerateSteps, {}, { steps }],
  ),
  then: actions([Requesting.respond, { request, steps }]),
});

/** Responds with an error if step regeneration fails. */
export const RegenerateStepsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/regenerateSteps" }, {
      request,
    }],
    [MilestoneTracker.regenerateSteps, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/** Handles a request to add a manual step to a goal. */
export const AddStepRequest: Sync = (
  { request, session, goalId, description, user, step },
) => {
  return ({
    when: actions([
      Requesting.request,
      {
        path: "/MilestoneTracker/addStep",
        session,
        goalId,
        description,
      },
      { request },
    ]),
    where: async (frames) =>
      await frames.query(Sessioning._getUser, { session }, { user }),
    then: actions([MilestoneTracker.addStep, {
      goal: goalId,
      description,
    }, { step }]),
  });
};

/** Responds with the newly added step's ID. */
export const AddStepResponse: Sync = ({ request, step }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/addStep" }, { request }],
    [MilestoneTracker.addStep, {}, { step }],
  ),
  then: actions([Requesting.respond, { request, step }]),
});

/** Handles a request to mark a step as complete. */
export const CompleteStepRequest: Sync = (
  { request, session, stepId, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/completeStep", session, stepId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.completeStep, { step: stepId }, {}]),
});

/** Responds on successful step completion. */
export const CompleteStepResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/completeStep" }, {
      request,
    }],
    [MilestoneTracker.completeStep, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

/** Responds with an error if step completion fails. */
export const CompleteStepResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/completeStep" }, {
      request,
    }],
    [MilestoneTracker.completeStep, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/** Handles a request to remove a step. */
export const RemoveStepRequest: Sync = (
  { request, session, stepId, user },
) => {
  return ({
    when: actions([
      Requesting.request,
      { path: "/MilestoneTracker/removeStep", session, stepId },
      { request },
    ]),
    where: async (frames) =>
      await frames.query(Sessioning._getUser, { session }, { user }),
    then: actions([MilestoneTracker.removeStep, { step: stepId }, {}]),
  });
};

/** Responds on successful step removal. */
export const RemoveStepResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/removeStep" }, { request }],
    [MilestoneTracker.removeStep, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

/** Responds with an error if step removal fails. */
export const RemoveStepResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/removeStep" }, { request }],
    [MilestoneTracker.removeStep, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- Query Syncs --//

/** Handles a request to get a user's goal(s), optionally filtered by hobby. */
export const GetGoalRequest: Sync = (
  {
    request,
    session,
    hobby,
    user,
    goalId,
    goalDescription,
    goalHobby,
    goalIsActive,
    goals,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getGoal", session, hobby },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      MilestoneTracker._getGoal,
      { user, hobby },
      {
        id: goalId,
        description: goalDescription,
        hobby: goalHobby,
        isActive: goalIsActive,
      },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [goals]: [] });
    }
    return frames.collectAs(
      [goalId, goalDescription, goalHobby, goalIsActive],
      goals,
    );
  },
  then: actions([Requesting.respond, { request, goals }]),
});

/** Handles a request to get all of a user's goals. */
export const GetGoalsRequest: Sync = (
  {
    request,
    session,
    user,
    goalId,
    goalDescription,
    goalHobby,
    goalIsActive,
    goals,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getGoals", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      MilestoneTracker._getGoals,
      { user },
      {
        id: goalId,
        description: goalDescription,
        hobby: goalHobby,
        isActive: goalIsActive,
      },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [goals]: [] });
    }
    return frames.collectAs(
      [goalId, goalDescription, goalHobby, goalIsActive],
      goals,
    );
  },
  then: actions([Requesting.respond, { request, goals }]),
});

/** Handles a request to get the steps for a goal. */
export const GetStepsRequest: Sync = (
  {
    request,
    session,
    goalId,
    user,
    id,
    description,
    start,
    completion,
    isComplete,
    steps,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getSteps", session, goalId },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      MilestoneTracker._getSteps,
      { goal: goalId },
      { id, description, start, completion, isComplete },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [steps]: [] });
    }
    return frames.collectAs(
      [id, description, start, completion, isComplete],
      steps,
    );
  },
  then: actions([Requesting.respond, { request, steps }]),
});

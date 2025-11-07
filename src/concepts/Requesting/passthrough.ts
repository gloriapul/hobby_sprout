/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // No public passthroughs for registration/authentication; all go through syncs
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // PasswordAuthentication - force registration and authentication through syncs
  "/api/PasswordAuthentication/register",
  "/api/PasswordAuthentication/authenticate",
  // PasswordAuthentication - all routes except register go through syncs
  "/api/PasswordAuthentication/deleteUser",
  "/api/PasswordAuthentication/_getUser",

  // MilestoneTracker - all routes go through syncs
  "/api/MilestoneTracker/createGoal",
  "/api/MilestoneTracker/closeGoal",
  "/api/MilestoneTracker/generateSteps",
  "/api/MilestoneTracker/regenerateSteps",
  "/api/MilestoneTracker/addStep",
  "/api/MilestoneTracker/completeStep",
  "/api/MilestoneTracker/removeStep",
  "/api/MilestoneTracker/_getGoal",
  "/api/MilestoneTracker/_getGoals",
  "/api/MilestoneTracker/_getSteps",
  "/api/MilestoneTracker/_getIncompleteSteps",
  "/api/MilestoneTracker/_getCompleteSteps",

  // UserProfile - all routes go through syncs
  "/api/UserProfile/createProfile",
  "/api/UserProfile/setName",
  "/api/UserProfile/setImage",
  "/api/UserProfile/closeProfile",
  "/api/UserProfile/setHobby",
  "/api/UserProfile/closeHobby",
  "/api/UserProfile/_getUserProfile",
  "/api/UserProfile/_getUserHobbies",
  "/api/UserProfile/_getActiveHobbies",

  // QuizMatchmaker - all routes go through syncs
  "/api/QuizMatchmaker/generateHobbyMatch",
  "/api/QuizMatchmaker/deleteHobbyMatches",
  "/api/QuizMatchmaker/_getAllHobbyMatches",
  "/api/QuizMatchmaker/_getMatchedHobby",

  // Sessioning - used internally by syncs, not direct endpoints
  "/api/Sessioning/start",
  "/api/Sessioning/end",
  "/api/Sessioning/_getUser",

  // Logout, explicitly add here to make it clear it exists and is used
  "/api/logout",

  // MilestoneTracker - private helper methods, not actions
  "/api/MilestoneTracker/initializeLLM",
  "/api/MilestoneTracker/validateStepQuality",

  // QuizMatchmaker - private helper methods, not actions
  "/api/QuizMatchmaker/sanitizeHobbyName",
  "/api/QuizMatchmaker/initializeLLM",
];

---
timestamp: 'Fri Oct 17 2025 01:18:51 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_011851.3abd6413.md]]'
content_id: cafa8f3b5e8581c2fb701eba5aaa78501072d0eb62e38fd5cf34c96e1481bfec
---

# file: src/quizmatchmaker/QuizMatchmakerConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assertExists, assertInstanceOf } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import QuizMatchmakerConcept from "./QuizMatchmakerConcept.ts";
import { ID, Empty } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Helper to get hardcoded questions from the concept for testing
// This accesses a private constant, which is generally discouraged but necessary for thorough testing of hardcoded data.
// A better long-term solution might be a public query for hardcoded questions if the concept definition allows.
// For now, we'll import it directly to ensure tests are robust against internal concept changes if the query changes.
import { QUIZ_QUESTIONS } from "./QuizMatchmakerConcept.ts";

const TEST_USER_ALICE = "user:Alice" as ID;
const TEST_USER_BOB = "user:Bob" as ID;
const UNKNOWN_USER = "user:Unknown" as ID;
const INVALID_QUESTION_ID = "q_invalid" as ID;

Deno.test("QuizMatchmakerConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new QuizMatchmakerConcept(db);

  // Clear state before each test suite to ensure isolation
  // The testDb function already handles dropping the database, but these explicit clears
  // can be useful for finer-grained control within a larger test file if needed.
  await concept._clearAllUserResponses();
  await concept._clearAllHobbyMatches();

  Deno.test(t, "Principle: User completes quiz and gets a hobby match", async () => {
    console.log("\n--- Principle Test: User completes quiz and gets a hobby match ---");

    const user = TEST_USER_ALICE;
    const questions = await concept._getQuestions();
    assertNotEquals(questions.length, 0, "Precondition: There should be predefined questions.");

    console.log(`User: ${user}`);
    console.log("Submitting responses for all questions...");
    const responses: { question: ID; answerText: string }[] = [];
    for (const q of questions) {
      const answer = `My answer for ${q.text} (question ${q.order})`;
      console(`  Submitting for Q${q.order} (${q.text}): ${answer}`);
      const result = await concept.submitResponse({ user, question: q._id, answerText: answer });
      assertEquals(result, {}, `Action: submitResponse for ${q._id} should succeed.`);
      responses.push({ question: q._id, answerText: answer });
    }

    const userResponsesAfterSubmission = await concept._getUserResponses({ user });
    assertEquals(userResponsesAfterSubmission.length, questions.length, "Effect: All responses should be recorded.");
    console.log("All responses submitted and verified.");

    console.log("Attempting to generate hobby match...");
    const matchResult = await concept.generateHobbyMatch({ user });

    // Check if LLM API key is available
    if ((matchResult as { error: string }).error?.includes("LLM model not initialized")) {
      console.warn("Skipping LLM-dependent part of principle test: GEMINI_API_KEY is not set.");
      // Skip further assertions if LLM isn't available
    } else {
      assertNotEquals((matchResult as { error: string }).error, "LLM model not initialized", "LLM should be initialized for this part of the test.");
      assertExists((matchResult as { matchedHobby: string }).matchedHobby, "Action: generateHobbyMatch should return a hobby.");
      const matchedHobby = (matchResult as { matchedHobby: string }).matchedHobby;
      console.log(`Action: generateHobbyMatch succeeded. Matched hobby: ${matchedHobby}`);
      assertEquals(typeof matchedHobby, "string", "Effect: matchedHobby should be a string.");
      assertNotEquals(matchedHobby.length, 0, "Effect: matchedHobby should not be empty.");

      const retrievedHobby = await concept._getMatchedHobby({ user });
      assertEquals(retrievedHobby.length, 1, "Query: _getMatchedHobby should return one match.");
      assertEquals(retrievedHobby[0].hobby, matchedHobby, "Effect: The stored hobby match should be retrievable.");
      console.log(`Query: _getMatchedHobby verified. Retrieved hobby: ${retrievedHobby[0].hobby}`);
    }

    console.log("Principle test complete.");
  });

  Deno.test(t, "Action: submitResponse - successful submission", async () => {
    console.log("\n--- Testing submitResponse - success ---");
    const user = TEST_USER_BOB;
    const question = QUIZ_QUESTIONS[0]._id; // Use first hardcoded question
    const answer = "I love being outdoors.";

    console.log(`User: ${user}, Question: ${question}, Answer: "${answer}"`);
    const result = await concept.submitResponse({ user, question, answerText: answer });
    assertEquals(result, {}, "Action: submitResponse should return an empty object on success.");
    console.log("Action succeeded. Verifying effects...");

    const responses = await concept._getUserResponses({ user });
    assertEquals(responses.length, 1, "Effect: One response should be recorded for the user.");
    assertEquals(responses[0].question, question, "Effect: The recorded response question ID should match.");
    assertEquals(responses[0].answerText, answer, "Effect: The recorded response answer text should match.");
    console.log("Effects verified.");
  });

  Deno.test(t, "Action: submitResponse - invalid question ID", async () => {
    console.log("\n--- Testing submitResponse - invalid question ID ---");
    const user = TEST_USER_BOB;
    const question = INVALID_QUESTION_ID;
    const answer = "This won't work.";

    console.log(`User: ${user}, Question: ${question}, Answer: "${answer}"`);
    const result = await concept.submitResponse({ user, question, answerText: answer });
    assertNotEquals((result as Empty).error, undefined, "Action: submitResponse should return an error.");
    assertEquals((result as { error: string }).error, `Question with ID ${question} is not a valid predefined quiz question.`, "Requirement: Invalid question ID should be rejected.");
    console.log("Error as expected:", (result as { error: string }).error);
  });

  Deno.test(t, "Action: submitResponse - user already responded to question", async () => {
    console.log("\n--- Testing submitResponse - user already responded ---");
    const user = TEST_USER_BOB;
    const question = QUIZ_QUESTIONS[1]._id; // Use second hardcoded question
    const firstAnswer = "My first answer.";
    const secondAnswer = "My second answer, shouldn't be accepted.";

    console.log(`User: ${user}, Question: ${question}`);
    console.log(`Submitting first response: "${firstAnswer}"`);
    let result = await concept.submitResponse({ user, question, answerText: firstAnswer });
    assertEquals(result, {}, "Precondition: First submission should succeed.");

    console.log(`Submitting second response: "${secondAnswer}"`);
    result = await concept.submitResponse({ user, question, answerText: secondAnswer });
    assertNotEquals((result as Empty).error, undefined, "Action: submitResponse should return an error.");
    assertEquals((result as { error: string }).error, `User ${user} has already submitted a response for question ${question}. Use updateResponse to change it.`, "Requirement: Duplicate submission should be rejected.");
    console.log("Error as expected:", (result as { error: string }).error);

    const responses = await concept._getUserResponses({ user });
    const matchingResponse = responses.find(r => r.question === question);
    assertExists(matchingResponse, "Response should still exist.");
    assertEquals(matchingResponse.answerText, firstAnswer, "Effect: Answer should remain the first one.");
    console.log("Effects verified (answer was not updated).");
  });

  Deno.test(t, "Action: updateResponse - successful update", async () => {
    console.log("\n--- Testing updateResponse - success ---");
    const user = TEST_USER_ALICE; // Reusing Alice for update test
    const question = QUIZ_QUESTIONS[0]._id;
    const originalAnswer = "Original answer text.";
    const updatedAnswer = "Updated answer text!";

    // Ensure a response exists first
    console.log(`User: ${user}, Question: ${question}`);
    console.log(`Submitting original response: "${originalAnswer}"`);
    let result = await concept.submitResponse({ user, question, answerText: originalAnswer });
    assertEquals(result, {}, "Precondition: Initial submission should succeed.");

    console.log(`Updating response to: "${updatedAnswer}"`);
    result = await concept.updateResponse({ user, question, newAnswerText: updatedAnswer });
    assertEquals(result, {}, "Action: updateResponse should return an empty object on success.");
    console.log("Action succeeded. Verifying effects...");

    const responses = await concept._getUserResponses({ user });
    const matchingResponse = responses.find(r => r.question === question);
    assertExists(matchingResponse, "Response should still exist after update.");
    assertEquals(matchingResponse.answerText, updatedAnswer, "Effect: The response text should be updated.");
    console.log("Effects verified.");
  });

  Deno.test(t, "Action: updateResponse - invalid question ID", async () => {
    console.log("\n--- Testing updateResponse - invalid question ID ---");
    const user = TEST_USER_ALICE;
    const question = INVALID_QUESTION_ID;
    const answer = "Still won't work.";

    console.log(`User: ${user}, Question: ${question}, Answer: "${answer}"`);
    const result = await concept.updateResponse({ user, question, newAnswerText: answer });
    assertNotEquals((result as Empty).error, undefined, "Action: updateResponse should return an error.");
    assertEquals((result as { error: string }).error, `Question with ID ${question} is not a valid predefined quiz question.`, "Requirement: Invalid question ID should be rejected.");
    console.log("Error as expected:", (result as { error: string }).error);
  });

  Deno.test(t, "Action: updateResponse - no prior response", async () => {
    console.log("\n--- Testing updateResponse - no prior response ---");
    const user = TEST_USER_BOB; // Use Bob who might not have responses for this question
    const question = QUIZ_QUESTIONS[2]._id; // Use third hardcoded question
    const newAnswer = "Trying to update non-existent response.";

    console.log(`User: ${user}, Question: ${question}, Answer: "${newAnswer}"`);
    const result = await concept.updateResponse({ user, question, newAnswerText: newAnswer });
    assertNotEquals((result as Empty).error, undefined, "Action: updateResponse should return an error.");
    assertEquals((result as { error: string }).error, `User ${user} has not submitted a response for question ${question} yet. Use submitResponse to create it.`, "Requirement: Must have an existing response to update.");
    console.log("Error as expected:", (result as { error: string }).error);
  });

  Deno.test(t, "Action: updateResponse - hobby match already exists", async () => {
    console.log("\n--- Testing updateResponse - hobby match already exists ---");
    const user = TEST_USER_ALICE;
    const question = QUIZ_QUESTIONS[1]._id; // Use Alice with a question she hasn't answered yet in this session
    const originalAnswer = "Temporary answer.";
    const updatedAnswer = "Updated after match.";

    // 1. Submit a response
    console.log(`User: ${user}, Question: ${question}`);
    let result = await concept.submitResponse({ user, question, answerText: originalAnswer });
    assertEquals(result, {}, "Precondition: Initial submission should succeed.");

    // 2. Simulate generating a hobby match for Alice (ensure all questions are answered)
    console.log("Ensuring user has all responses for hobby match generation...");
    const questions = await concept._getQuestions();
    for (const q of questions) {
        const existing = (await concept._getUserResponses({ user })).find(r => r.question === q._id);
        if (!existing) {
            await concept.submitResponse({ user, question: q._id, answerText: `Answer for ${q.text}` });
        }
    }
    const generateResult = await concept.generateHobbyMatch({ user });
    if ((generateResult as { error: string }).error?.includes("LLM model not initialized")) {
      console.warn("Skipping LLM-dependent part: GEMINI_API_KEY is not set. Cannot test update after match.");
    } else {
        assertExists((generateResult as { matchedHobby: string }).matchedHobby, "Precondition: Hobby match should be generated.");
        console.log(`Precondition: Hobby match generated for ${user}: ${(generateResult as { matchedHobby: string }).matchedHobby}`);

        // 3. Try to update a response
        console.log(`Attempting to update response after hobby match exists: "${updatedAnswer}"`);
        result = await concept.updateResponse({ user, question, newAnswerText: updatedAnswer });
        assertNotEquals((result as Empty).error, undefined, "Action: updateResponse should return an error.");
        assertEquals((result as { error: string }).error, `Cannot update response for user ${user} as a hobby match has already been generated. Delete the match first if you wish to update answers.`, "Requirement: Cannot update response if a match already exists.");
        console.log("Error as expected:", (result as { error: string }).error);
    }
  });

  Deno.test(t, "Action: generateHobbyMatch - successful generation (requires GEMINI_API_KEY)", async () => {
    console.log("\n--- Testing generateHobbyMatch - success ---");
    const user = TEST_USER_BOB; // Reusing Bob

    // Ensure Bob has responded to all questions
    console.log(`Ensuring ${user} has all responses for hobby match generation...`);
    const questions = await concept._getQuestions();
    for (const q of questions) {
      const existing = (await concept._getUserResponses({ user })).find(r => r.question === q._id);
      if (!existing) {
        await concept.submitResponse({ user, question: q._id, answerText: `Answer for ${q.text}` });
      }
    }
    const userResponses = await concept._getUserResponses({ user });
    assertEquals(userResponses.length, questions.length, "Precondition: User should have all responses.");
    console.log("All responses submitted.");

    console.log(`Generating hobby match for ${user}...`);
    const result = await concept.generateHobbyMatch({ user });

    if ((result as { error: string }).error?.includes("LLM model not initialized")) {
      console.warn("Skipping LLM-dependent test: GEMINI_API_KEY is not set.");
    } else {
      assertExists((result as { matchedHobby: string }).matchedHobby, "Action: generateHobbyMatch should return a hobby.");
      const matchedHobby = (result as { matchedHobby: string }).matchedHobby;
      console.log(`Action succeeded. Matched hobby: ${matchedHobby}`);
      assertEquals(typeof matchedHobby, "string", "Effect: matchedHobby should be a string.");
      assertNotEquals(matchedHobby.length, 0, "Effect: matchedHobby should not be empty.");

      // Verify state change
      const storedMatch = await concept.hobbyMatches.findOne({ _id: user });
      assertExists(storedMatch, "Effect: Hobby match should be stored in the database.");
      assertEquals(storedMatch.matchedHobby, matchedHobby, "Effect: Stored hobby should match returned hobby.");
      assertInstanceOf(storedMatch.matchedAt, Date, "Effect: matchedAt should be a Date object.");
      console.log("Effects verified.");
    }
  });

  Deno.test(t, "Action: generateHobbyMatch - LLM not initialized (missing API key)", async () => {
    console.log("\n--- Testing generateHobbyMatch - LLM not initialized ---");
    const user = freshID() as ID; // New user to ensure no existing match/responses interfere

    // Force trigger the error condition
    const originalGeminiApiKey = Deno.env.get("GEMINI_API_KEY");
    Deno.env.delete("GEMINI_API_KEY"); // Temporarily unset the key

    // Re-instantiate the concept to ensure it picks up the unset key
    const conceptWithoutKey = new QuizMatchmakerConcept(db);

    console.log(`Attempting to generate match for ${user} with missing LLM API key...`);
    const result = await conceptWithoutKey.generateHobbyMatch({ user });

    // Restore the API key after the test
    if (originalGeminiApiKey) {
      Deno.env.set("GEMINI_API_KEY", originalGeminiApiKey);
    }

    assertNotEquals((result as Empty).error, undefined, "Action: generateHobbyMatch should return an error.");
    assertEquals((result as { error: string }).error, "LLM model not initialized. GEMINI_API_KEY might be missing or invalid.", "Requirement: Should return error if LLM is not initialized.");
    console.log("Error as expected:", (result as { error: string }).error);
  });


  Deno.test(t, "Action: generateHobbyMatch - not all questions answered", async () => {
    console.log("\n--- Testing generateHobbyMatch - not all questions answered ---");
    const user = freshID() as ID; // Another new user
    const question = QUIZ_QUESTIONS[0]._id;
    const answer = "Just one answer.";

    console.log(`User: ${user}`);
    console.log(`Submitting only one response for question ${question}: "${answer}"`);
    await concept.submitResponse({ user, question, answerText: answer });

    console.log("Attempting to generate hobby match with incomplete responses...");
    const result = await concept.generateHobbyMatch({ user });
    assertNotEquals((result as Empty).error, undefined, "Action: generateHobbyMatch should return an error.");
    assertEquals((result as { error: string }).error, `User ${user} has not answered all ${QUIZ_QUESTIONS.length} questions. Please submit responses for all questions.`, "Requirement: All questions must be answered.");
    console.log("Error as expected:", (result as { error: string }).error);
  });

  Deno.test(t, "Action: generateHobbyMatch - match already exists", async () => {
    console.log("\n--- Testing generateHobbyMatch - match already exists ---");
    const user = TEST_USER_ALICE; // Use Alice, for whom a match was generated in the principle test

    const existingMatch = await concept.hobbyMatches.findOne({ _id: user });
    assertExists(existingMatch, "Precondition: A hobby match should already exist for Alice.");
    console.log(`Precondition: User ${user} already has a match: "${existingMatch.matchedHobby}".`);

    console.log(`Attempting to generate another hobby match for ${user}...`);
    const result = await concept.generateHobbyMatch({ user });
    assertNotEquals((result as Empty).error, undefined, "Action: generateHobbyMatch should return an error.");
    assertEquals((result as { error: string }).error, `User ${user} already has a generated hobby match: "${existingMatch.matchedHobby}".`, "Requirement: Cannot generate a new match if one already exists.");
    console.log("Error as expected:", (result as { error: string }).error);
  });

  Deno.test(t, "Query: _getQuestions - retrieves all hardcoded questions", async () => {
    console.log("\n--- Testing _getQuestions ---");
    const questions = await concept._getQuestions();
    console.log(`Retrieved ${questions.length} questions.`);
    assertEquals(questions.length, QUIZ_QUESTIONS.length, "Query: Should return all hardcoded questions.");

    // Verify content and order
    questions.forEach((q, index) => {
      assertEquals(q._id, QUIZ_QUESTIONS.find(oq => oq.order === index + 1)?._id, `Query: Question at index ${index} should match ordered hardcoded question ID.`);
      assertEquals(q.text, QUIZ_QUESTIONS.find(oq => oq.order === index + 1)?.text, `Query: Question at index ${index} should match ordered hardcoded question text.`);
      assertEquals(q.order, index + 1, `Query: Question at index ${index} should have order ${index + 1}.`);
    });
    console.log("Questions retrieved and verified for content and order.");
  });

  Deno.test(t, "Query: _getUserResponses - retrieves responses for a user", async () => {
    console.log("\n--- Testing _getUserResponses ---");
    const user = TEST_USER_ALICE; // Alice should have responses from the principle test
    const questions = await concept._getQuestions();

    const responses = await concept._getUserResponses({ user });
    console.log(`Retrieved ${responses.length} responses for user ${user}.`);
    assertEquals(responses.length, questions.length, "Query: Should retrieve all responses for the user.");

    const expectedQuestions = questions.map(q => q._id);
    const receivedQuestions = responses.map(r => r.question);
    assertEquals(receivedQuestions.sort(), expectedQuestions.sort(), "Query: Retrieved questions should match expected questions.");
    console.log("Responses retrieved and verified for content.");
  });

  Deno.test(t, "Query: _getUserResponses - returns empty for unknown user", async () => {
    console.log("\n--- Testing _getUserResponses - unknown user ---");
    const user = UNKNOWN_USER;
    const responses = await concept._getUserResponses({ user });
    console.log(`Retrieved ${responses.length} responses for unknown user ${user}.`);
    assertEquals(responses.length, 0, "Query: Should return an empty array for a user with no responses.");
    console.log("Empty responses as expected.");
  });

  Deno.test(t, "Query: _getMatchedHobby - retrieves hobby match for user", async () => {
    console.log("\n--- Testing _getMatchedHobby ---");
    const user = TEST_USER_ALICE; // Alice should have a match from the principle test
    const match = await concept.hobbyMatches.findOne({ _id: user });
    assertExists(match, "Precondition: User Alice should have a hobby match in DB.");

    console.log(`Retrieving matched hobby for user ${user}...`);
    const retrievedHobby = await concept._getMatchedHobby({ user });
    console.log(`Retrieved: ${JSON.stringify(retrievedHobby)}`);

    assertEquals(retrievedHobby.length, 1, "Query: Should return one hobby match.");
    assertEquals(retrievedHobby[0].hobby, match.matchedHobby, "Query: Retrieved hobby should match the stored one.");
    console.log("Hobby match retrieved and verified.");
  });

  Deno.test(t, "Query: _getMatchedHobby - returns error for user without match", async () => {
    console.log("\n--- Testing _getMatchedHobby - no match ---");
    const user = freshID() as ID; // A new user who won't have a match
    console.log(`Retrieving matched hobby for new user ${user} (no match)...`);
    const retrievedHobby = await concept._getMatchedHobby({ user });
    console.log(`Retrieved: ${JSON.stringify(retrievedHobby)}`);
    assertNotEquals((retrievedHobby as Empty).error, undefined, "Query: Should return an error for user without a match.");
    assertEquals((retrievedHobby as { error: string }).error, `No hobby match found for user ${user}.`, "Query: Error message should indicate no match.");
    console.log("Error as expected.");
  });

  // Ensure to close the MongoDB client after all tests in this file are done
  await client.close();
});
```

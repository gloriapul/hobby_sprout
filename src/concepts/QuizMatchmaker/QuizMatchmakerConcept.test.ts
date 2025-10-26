import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import QuizMatchmakerConcept, {
  QUIZ_QUESTIONS,
} from "./QuizMatchmakerConcept.ts";

const userA = "user:Alice" as ID;
const userB = "user:Bob" as ID;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// helper functions to reduce repetitive code
async function submitAllResponses(
  quizConcept: QuizMatchmakerConcept,
  user: ID,
  answerPrefix = "Answer to",
): Promise<void> {
  for (const q of QUIZ_QUESTIONS) {
    const result = await quizConcept.submitResponse({
      user,
      question: q._id,
      answerText: `${answerPrefix} question ${q.order}: ${q.text}`,
    });
    assertEquals(
      "error" in result,
      false,
      `Submitting response for question ${q.order} should succeed`,
    );
  }
}

function hasError(result: unknown): boolean {
  return typeof result === "object" && result !== null && "error" in result;
}

Deno.test("Principle: User answers personality quiz and receives hobby match", async () => {
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);

  try {
    console.log("1. Submitting answers to all questions");
    await submitAllResponses(quizConcept, userA);

    console.log("2. Generating hobby match from answers");
    if (!GEMINI_API_KEY) {
      console.log(
        "   - GEMINI_API_KEY not set; skipping LLM generation in principle test",
      );
      return;
    }

    // Initialize LLM and generate a real match
    quizConcept.initializeLLM(GEMINI_API_KEY);
    const matchResult = await quizConcept.generateHobbyMatch({ user: userA });
    if ("error" in matchResult) {
      throw new Error(
        `Unexpected error generating match: ${matchResult.error}`,
      );
    }

    const { matchedHobby } = matchResult;
    console.log(`   ✓ LLM suggested hobby: "${matchedHobby}"`);
    assertExists(matchedHobby, "Should return a matched hobby");
    assertNotEquals(
      matchedHobby.length,
      0,
      "Matched hobby should not be empty",
    );

    console.log("3. Verifying match is stored");
    const storedMatch = await quizConcept._getMatchedHobby({ user: userA });
    assertEquals(
      hasError(storedMatch),
      false,
      "Retrieving stored match should succeed",
    );
    if (!hasError(storedMatch) && Array.isArray(storedMatch)) {
      assertEquals(
        storedMatch[0].hobby,
        matchedHobby,
        "Stored hobby should match returned hobby",
      );
      console.log("   ✓ Match stored correctly in database");
    }
    console.log(
      "4. Principle satisfied: User can answer the quiz and receive a stored hobby match",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteHobbyMatchById deletes only the selected match", async () => {
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);
  const testUser = "user:DeleteByIdUser" as ID;

  try {
    // Submit responses and generate two matches
    await submitAllResponses(quizConcept, testUser, "DeleteById test answer");
    if (GEMINI_API_KEY) {
      quizConcept.initializeLLM(GEMINI_API_KEY);
      // Generate two matches for the user
      await quizConcept.generateHobbyMatch({ user: testUser });
      await quizConcept.generateHobbyMatch({ user: testUser });
    }
    // Get all matches and ensure there are two
    const allMatches = await quizConcept._getAllHobbyMatches({
      user: testUser,
    });
    assertEquals(
      Array.isArray(allMatches),
      true,
      "Should return an array of matches",
    );
    if (!Array.isArray(allMatches) || allMatches.length < 2) {
      throw new Error("Expected at least two matches for delete-by-id test");
    }

    // Type assertion for test clarity
    type MatchWithId = { id: string; hobby: string; matchedAt: Date };
    const [firstMatch, secondMatch] = allMatches as MatchWithId[];
    // Delete the first match by ID
    const deleteResult = await quizConcept.deleteHobbyMatchById({
      user: testUser,
      matchId: firstMatch.id as ID,
    });
    assertEquals(hasError(deleteResult), false, "Delete by ID should succeed");

    // Get all matches again and ensure only the second remains
    const matchesAfterDelete = await quizConcept._getAllHobbyMatches({
      user: testUser,
    });
    assertEquals(
      Array.isArray(matchesAfterDelete),
      true,
      "Should return an array after delete",
    );
    if (Array.isArray(matchesAfterDelete)) {
      const matchesAfter = matchesAfterDelete as MatchWithId[];
      assertEquals(
        matchesAfter.length,
        allMatches.length - 1,
        "One match should be deleted",
      );
      assertEquals(
        matchesAfter[0].id as ID,
        secondMatch.id as ID,
        "The remaining match should be the second one",
      );
    }
  } finally {
    await client.close();
  }
});

Deno.test(
  {
    name: "Action: generateHobbyMatch produces meaningful hobby match via LLM",
    ignore: !GEMINI_API_KEY,
    fn: async () => {
      const [db, client] = await testDb();
      const quizConcept = new QuizMatchmakerConcept(db, GEMINI_API_KEY);

      try {
        console.log("1. Submitting thoughtful answers to all questions");
        const answers = [
          "I definitely prefer spending time outdoors, especially in nature",
          "I'm more drawn to creative activities where I can express myself",
          "I enjoy social interaction but also like activities I can do alone",
          "I love learning new skills and challenging myself",
          "I'm comfortable with moderate physical activity but nothing too strenuous",
        ];

        // Submit answers in order
        for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
          const result = await quizConcept.submitResponse({
            user: userB,
            question: QUIZ_QUESTIONS[i]._id,
            answerText: answers[i < answers.length ? i : 0],
          });
          assertEquals(
            "error" in result,
            false,
            `Submitting answer for question ${i + 1} should succeed`,
          );
        }

        console.log("2. Generating hobby match using LLM");
        const matchResult = await quizConcept.generateHobbyMatch({
          user: userB,
        });
        assertEquals(
          hasError(matchResult),
          false,
          "Hobby match generation should succeed with valid API key",
        );

        const { matchedHobby } = matchResult as { matchedHobby: string };
        console.log(`   ✓ LLM suggested hobby: "${matchedHobby}"`);
        assertExists(matchedHobby, "Should return a valid hobby");
        assertNotEquals(matchedHobby.length, 0, "Hobby should not be empty");

        console.log("3. Verifying match is stored in database");
        const storedMatch = await quizConcept._getMatchedHobby({ user: userB });
        assertEquals(
          hasError(storedMatch),
          false,
          "Retrieving stored match should succeed",
        );

        if (!hasError(storedMatch) && Array.isArray(storedMatch)) {
          assertEquals(
            storedMatch[0].hobby,
            matchedHobby,
            "Stored hobby should match returned hobby",
          );
          console.log("   ✓ Match stored correctly in database");
        }

        // Attempt to generate a second match
        console.log(
          "4. Generating a second match (should succeed and be added to user's match list)",
        );
        const secondMatchResult = await quizConcept.generateHobbyMatch({
          user: userB,
        });
        assertEquals(
          hasError(secondMatchResult),
          false,
          "Generating a second match should succeed",
        );
        const { matchedHobby: secondMatchedHobby } = secondMatchResult as {
          matchedHobby: string;
        };
        console.log(`   ✓ Second match generated: "${secondMatchedHobby}"`);

        console.log(
          "5. Action requirements satisfied: generateHobbyMatch allows multiple matches per user and stores each match.",
        );
      } finally {
        await client.close();
      }
    },
  },
);

Deno.test("Action: submitResponse requirements and restrictions", async () => {
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);

  try {
    console.log("1. Attempt invalid question submission (should fail)");
    const invalidResult = await quizConcept.submitResponse({
      user: userA,
      question: "invalid:question" as ID,
      answerText: "This should fail",
    });
    assertEquals(
      hasError(invalidResult),
      true,
      "Using invalid question ID should fail",
    );
    console.log("   ✓ Invalid question rejected as expected");

    console.log("2. Get a valid question for testing");
    const testQuestion = QUIZ_QUESTIONS[0]._id;
    console.log(`   ✓ Using question: ${QUIZ_QUESTIONS[0].text}`);

    console.log("3. Submit a valid response");
    const submitResult = await quizConcept.submitResponse({
      user: userA,
      question: testQuestion,
      answerText: "My valid answer",
    });
    assertEquals(
      hasError(submitResult),
      false,
      "Valid submission should succeed",
    );
    console.log("   ✓ Valid submission succeeded");

    console.log("4. Attempt duplicate submission (should fail)");
    const duplicateResult = await quizConcept.submitResponse({
      user: userA,
      question: testQuestion,
      answerText: "Trying to change my answer",
    });
    assertEquals(
      hasError(duplicateResult),
      true,
      "Duplicate submission should fail",
    );
    console.log("   ✓ Duplicate submission rejected as expected");
    console.log(
      "5. Action requirements satisfied: submitResponse validates question IDs and prevents duplicates",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: updateResponse functionality and restrictions", async () => {
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);

  try {
    console.log("1. Get a valid question for testing");
    const testQuestion = QUIZ_QUESTIONS[0]._id;
    console.log(`   ✓ Using question: ${QUIZ_QUESTIONS[0].text}`);

    console.log("2. Update non-existent response (should fail)");
    const updateWithoutSubmitResult = await quizConcept.updateResponse({
      user: userA,
      question: testQuestion,
      newAnswerText: "Cannot update what doesn't exist",
    });
    assertEquals(
      hasError(updateWithoutSubmitResult),
      true,
      "Updating non-existent response should fail",
    );
    console.log("   ✓ Updating non-existent response rejected as expected");

    console.log("3. Submit then update the response");
    await quizConcept.submitResponse({
      user: userA,
      question: testQuestion,
      answerText: "Original answer",
    });

    const updateResult = await quizConcept.updateResponse({
      user: userA,
      question: testQuestion,
      newAnswerText: "Updated answer",
    });
    assertEquals(hasError(updateResult), false, "Valid update should succeed");
    console.log("   ✓ Update succeeded");

    console.log("4. Verify the update persisted");
    const responses = await quizConcept._getUserResponses({ user: userA });
    const updatedResponse = responses.find((r) => r.question === testQuestion);
    assertExists(updatedResponse, "Response should exist");
    assertEquals(updatedResponse.answerText, "Updated answer");
    console.log("   ✓ Update verified in stored responses");
    console.log(
      "5. Action requirements satisfied: updateResponse enforces preconditions and updates stored response",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteHobbyMatch functionality and integration with full lifecycle", async () => {
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);
  const testUser = "user:TestUser" as ID;

  try {
    console.log("1. Submitting responses for all quiz questions");
    await submitAllResponses(quizConcept, testUser, "Sample answer to");
    console.log("   ✓ All responses submitted successfully");

    // Initialize LLM if API key is present
    if (GEMINI_API_KEY) {
      console.log("2. Initializing LLM with API key");
      quizConcept.initializeLLM(GEMINI_API_KEY);
    } else {
      console.log(
        "   - GEMINI_API_KEY not set; test will likely fail without LLM",
      );
    }

    console.log("3. Generating initial hobby match");
    const matchResult = await quizConcept.generateHobbyMatch({
      user: testUser,
    });
    assertEquals(
      hasError(matchResult),
      false,
      "Hobby match generation should succeed",
    );
    const { matchedHobby } = matchResult as { matchedHobby: string };
    console.log(`   ✓ Generated hobby: "${matchedHobby}"`);

    console.log(
      "4. Attempting to update a response (should succeed even if matches exist)",
    );
    const updateResult = await quizConcept.updateResponse({
      user: testUser,
      question: QUIZ_QUESTIONS[0]._id,
      newAnswerText: "Changed answer",
    });
    assertEquals(
      hasError(updateResult),
      false,
      "Update should succeed even if matches exist",
    );
    console.log(
      "   ✓ Update succeeded even though matches exist",
    );

    console.log("5. Deleting the hobby match");
    const deleteResult = await quizConcept.deleteHobbyMatches({
      user: testUser,
    });
    assertEquals(
      hasError(deleteResult),
      false,
      "Match deletion should succeed",
    );
    console.log("   ✓ Match successfully deleted");

    console.log("6. Verifying match was actually removed");
    const matchCheck = await quizConcept._getMatchedHobby({ user: testUser });
    assertEquals(hasError(matchCheck), true, "Match should no longer exist");
    console.log(
      `   ✓ Match confirmed deleted: "${
        hasError(matchCheck) && "error" in matchCheck ? matchCheck.error : ""
      }"`,
    );

    console.log(
      "7. Now updating a response (should succeed after match deletion)",
    );
    const updateResultAfterDelete = await quizConcept.updateResponse({
      user: testUser,
      question: QUIZ_QUESTIONS[0]._id,
      newAnswerText: "Updated answer after match deletion",
    });
    assertEquals(
      hasError(updateResultAfterDelete),
      false,
      "Update should succeed after match deletion",
    );
    console.log("   ✓ Response successfully updated after match deletion");

    console.log("8. Generating a new hobby match after updates");
    const newMatchResult = await quizConcept.generateHobbyMatch({
      user: testUser,
    });
    assertEquals(
      hasError(newMatchResult),
      false,
      "New hobby match generation should succeed",
    );
    const { matchedHobby: newHobby } = newMatchResult as {
      matchedHobby: string;
    };
    console.log(`   ✓ New generated hobby: "${newHobby}"`);

    console.log(
      "9. Attempting to delete non-existent match (for a different user)",
    );
    const nonExistentResult = await quizConcept.deleteHobbyMatches({
      user: "user:NonExistent" as ID,
    });
    assertEquals(
      hasError(nonExistentResult),
      true,
      "Deleting non-existent match should fail",
    );
    console.log(
      `   ✓ Non-existent match deletion correctly rejected: "${
        hasError(nonExistentResult) && "error" in nonExistentResult
          ? nonExistentResult.error
          : ""
      }"`,
    );

    console.log(
      "10. Action requirements satisfied: deleteHobbyMatch enables the full response-match-delete-update-match lifecycle",
    );
  } finally {
    await client.close();
  }
});

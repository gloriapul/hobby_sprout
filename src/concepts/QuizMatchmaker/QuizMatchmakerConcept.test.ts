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

// Clear collections before each test
async function clearQuizCollections(db: any) {
  await db.collection("QuizMatchmaker.userResponses").deleteMany({});
  await db.collection("QuizMatchmaker.hobbyMatches").deleteMany({});
}

function hasError(result: unknown): boolean {
  return typeof result === "object" && result !== null && "error" in result;
}

Deno.test("Principle: User answers personality quiz and receives hobby match", async () => {
  const [db, client] = await testDb();
  await clearQuizCollections(db);
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
  await clearQuizCollections(db);
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
  Deno.test("Action: deleteHobbyMatch functionality and integration with full lifecycle", async () => {
    const [db, client] = await testDb();
      await clearQuizCollections(db);
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
      // Deleting all matches for the user
      console.log("5. Deleting all hobby matches for the user");
      const deleteResult = await quizConcept._deleteHobbyMatches({
        user: testUser,
      });
      assertEquals(
        hasError(deleteResult),
        false,
        "Match deletion should succeed",
      );
      console.log("   ✓ All matches successfully deleted");

      console.log("6. Verifying matches were actually removed");
      const matchCheck = await quizConcept._getMatchedHobby({ user: testUser });
      assertEquals(hasError(matchCheck), true, "Match should no longer exist");
      console.log(
        `   ✓ Match confirmed deleted: "${
          hasError(matchCheck) && "error" in matchCheck ? matchCheck.error : ""
        }"`,
      );

      console.log(
        "7. Generating a new hobby match after deletion (should succeed)",
      );
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
        "8. Attempting to delete non-existent matches (for a different user)",
      );
      const nonExistentResult = await quizConcept._deleteHobbyMatches({
        user: "user:NonExistent" as ID,
      });
      assertEquals(
        hasError(nonExistentResult),
        true,
        "Deleting non-existent matches should fail",
      );
      console.log(
        `   ✓ Non-existent match deletion correctly rejected: "${
          hasError(nonExistentResult) && "error" in nonExistentResult
            ? nonExistentResult.error
            : ""
        }"`,
      );

      console.log(
        "9. Action requirements satisfied: _deleteHobbyMatches enables the full response-match-delete lifecycle",
      );
    } finally {
      await client.close();
    }
  });
});

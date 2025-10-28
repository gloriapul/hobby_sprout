[@implementation](QuizMatchmaker.md)
[@gemini-llm](../../../src/utils/gemini-llm.ts)

[@testing-concepts](../../background/testing-concepts.md)

[@likert](../LikertSurvey/implementation.md)


# test: QuizMatchmaker

# response:

# file: src/quizmatchmaker/QuizMatchmakerConcept.test.ts

```typescript
import QuizMatchmakerConcept from "./QuizMatchmakerConcept.ts";
import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";

const userA = "user:Alice" as ID;
const userB = "user:Bob" as ID;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

function hasError(result: unknown): boolean {
  return typeof result === "object" && result !== null && "error" in result;
}

Deno.test("Principle: User can take 5-question quiz and receive hobby match", async () => {
  console.log("\n[Principle] Testing single quiz attempt and hobby match...");
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);
  try {
    const answers = [
      "I prefer outdoors.",
      "Creative activities.",
      "Social interaction is important.",
      "I love learning new skills.",
      "Moderate physical activity is fine.",
    ];
    if (!GEMINI_API_KEY) {
      console.log(
        "   - GEMINI_API_KEY not set; skipping LLM generation in test",
      );
      return;
    }
    quizConcept.initializeLLM(GEMINI_API_KEY);
    const matchResult = await quizConcept.generateHobbyMatch({
      user: userA,
      answers,
    });
    if ("error" in matchResult) {
      throw new Error(
        `Unexpected error generating match: ${matchResult.error}`,
      );
    }
    const { matchedHobby } = matchResult;
    assertExists(matchedHobby, "Should return a matched hobby");
    assertNotEquals(
      matchedHobby.length,
      0,
      "Matched hobby should not be empty",
    );
    console.log(`   ✓ Hobby match generated: ${matchedHobby}`);
    // Check that the match is stored and retrievable
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
      console.log(
        `   ✓ Hobby match stored and retrievable: ${storedMatch[0].hobby}`,
      );
    }
    console.log("[Principle] PASS: Single quiz attempt and hobby match");
  } finally {
    await client.close();
  }
});

Deno.test("Action: User can retake quiz and see multiple matches", async () => {
  console.log("\n[Action] Testing multiple quiz attempts and match history...");
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);
  try {
    if (!GEMINI_API_KEY) {
      console.log(
        "   - GEMINI_API_KEY not set; skipping LLM generation in test",
      );
      return;
    }
    quizConcept.initializeLLM(GEMINI_API_KEY);
    const answers1 = [
      "Outdoors.",
      "Creative.",
      "Social.",
      "Learning.",
      "Moderate activity.",
    ];
    const answers2 = [
      "Indoors.",
      "Analytical.",
      "Solo.",
      "Perfecting skills.",
      "Low activity.",
    ];
    const match1 = await quizConcept.generateHobbyMatch({
      user: userB,
      answers: answers1,
    });
    const match2 = await quizConcept.generateHobbyMatch({
      user: userB,
      answers: answers2,
    });
    if ("error" in match1) {
      throw new Error(
        `Unexpected error generating first match: ${match1.error}`,
      );
    }
    if ("error" in match2) {
      throw new Error(
        `Unexpected error generating second match: ${match2.error}`,
      );
    }
    assertExists(match1.matchedHobby, "First match should exist");
    assertExists(match2.matchedHobby, "Second match should exist");
    console.log(
      `   ✓ First match: ${match1.matchedHobby}\n   ✓ Second match: ${match2.matchedHobby}`,
    );
    // Check that both matches are in history
    const allMatches = await quizConcept._getAllHobbyMatches({ user: userB });
    assertEquals(
      Array.isArray(allMatches),
      true,
      "Should return an array of matches",
    );
    if (Array.isArray(allMatches)) {
      assertEquals(allMatches.length, 2, "Should have two matches in history");
      assertEquals(
        allMatches[0].hobby,
        match2.matchedHobby,
        "Most recent match should be first",
      );
      assertEquals(
        allMatches[1].hobby,
        match1.matchedHobby,
        "First match should be second in list",
      );
      console.log(
        `   ✓ Match history: [${allMatches.map((m) => m.hobby).join(", ")}]`,
      );
    }
    console.log("[Action] PASS: Multiple quiz attempts and match history");
  } finally {
    await client.close();
  }
});

Deno.test("Action: should fail if answers array is not length 5", async () => {
  console.log("\n[Action] Testing error for invalid answers array length...");
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);
  try {
    quizConcept.initializeLLM(GEMINI_API_KEY!);
    const result = await quizConcept.generateHobbyMatch({
      user: userA,
      answers: ["A", "B", "C"],
    });
    assertEquals(
      "error" in result,
      true,
      "Should return error for too few answers",
    );
    if ("error" in result) console.log(`   ✓ Error received: ${result.error}`);
    console.log("[Action] PASS: Error for invalid answers array length");
  } finally {
    await client.close();
  }
});

Deno.test("Action: should fail if LLM is not initialized", async () => {
  console.log("\n[Action] Testing error for uninitialized LLM...");
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);
  try {
    const result = await quizConcept.generateHobbyMatch({
      user: userA,
      answers: ["A", "B", "C", "D", "E"],
    });
    assertEquals(
      "error" in result,
      true,
      "Should return error if LLM not initialized",
    );
    if ("error" in result) console.log(`   ✓ Error received: ${result.error}`);
    console.log("[Action] PASS: Error for uninitialized LLM");
  } finally {
    await client.close();
  }
});

Deno.test("Action: should return error object for user with no matches", async () => {
  console.log("\n[Action] Testing error for user with no matches...");
  const [db, client] = await testDb();
  const quizConcept = new QuizMatchmakerConcept(db);
  try {
    const result = await quizConcept._getAllHobbyMatches({
      user: "user:NoMatch" as ID,
    });
    assertEquals(
      typeof result === "object" && result !== null && "error" in result,
      true,
      "Should return error object for no matches",
    );
    if (typeof result === "object" && result !== null && "error" in result) {
      console.log(`   ✓ Error received: ${result.error}`);
    }
    console.log("[Action] PASS: Error for user with no matches");
  } finally {
    await client.close();
  }
});
```
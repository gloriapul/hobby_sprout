---
timestamp: 'Fri Oct 17 2025 00:10:41 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_001041.2d46795f.md]]'
content_id: 0f10de2c00aff7f1bd3814cfea9c5600aec96bb3a4085768bd7896b9ccfa57dd
---

# file: src/concepts/UserProfileConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assertArrayIncludes, assertFalse, assertObjectMatch } from "@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserProfileConcept from "@concepts/UserProfileConcept.ts";

Deno.test("UserProfile Concept Tests", async (t) => {
  const [db, client] = await testDb();
  const userProfileConcept = new UserProfileConcept(db);

  const userA: ID = "user:Alice" as ID;
  const userB: ID = "user:Bob" as ID;
  const userC: ID = "user:Charlie" as ID; // For non-existent user tests

  // Helper to check for errors
  const isError = (result: any): result is { error: string } => {
    return typeof result === "object" && result !== null && "error" in result;
  };

  await t.step("Action: createProfile - Successful creation", async () => {
    console.log("\n--- Testing createProfile (Success) ---");
    const result = await userProfileConcept.createProfile({ user: userA });
    assertEquals(result, {}); // Expect empty object for success
    const profile = await userProfileConcept._getUserProfile({ user: userA });
    assertFalse(isError(profile), `Query should not return an error: ${JSON.stringify(profile)}`);
    assertObjectMatch(profile[0], { _id: userA, active: true });
    assertEquals(profile[0].displayname, undefined);
    assertEquals(profile[0].profile, undefined);
    console.log(`  Verified: Profile for ${userA} exists and is active.`);
  });

  await t.step("Action: createProfile - Duplicate creation (requires)", async () => {
    console.log("\n--- Testing createProfile (Duplicate) ---");
    const result = await userProfileConcept.createProfile({ user: userA });
    assertNotEquals(result, {}); // Expect an error
    assertEquals(isError(result), true);
    assertEquals((result as { error: string }).error, `Profile for user ${userA} already exists.`);
    console.log(`  Verified: Duplicate creation for ${userA} correctly returned an error.`);
  });

  await t.step("Action: setName - Successful name setting (effects)", async () => {
    console.log("\n--- Testing setName (Success) ---");
    const result = await userProfileConcept.setName({ user: userA, displayname: "Alice Smith" });
    assertEquals(result, {});
    const profile = await userProfileConcept._getUserProfile({ user: userA });
    assertFalse(isError(profile));
    assertEquals(profile[0].displayname, "Alice Smith");
    console.log(`  Verified: Display name for ${userA} is "Alice Smith".`);
  });

  await t.step("Action: setName - Update name (effects)", async () => {
    console.log("\n--- Testing setName (Update) ---");
    const result = await userProfileConcept.setName({ user: userA, displayname: "Ali S." });
    assertEquals(result, {});
    const profile = await userProfileConcept._getUserProfile({ user: userA });
    assertFalse(isError(profile));
    assertEquals(profile[0].displayname, "Ali S.");
    console.log(`  Verified: Display name for ${userA} updated to "Ali S.".`);
  });

  await t.step("Action: setName - Non-existent user (requires)", async () => {
    console.log("\n--- Testing setName (Non-existent user) ---");
    const result = await userProfileConcept.setName({ user: userC, displayname: "Charlie Brown" });
    assertNotEquals(result, {});
    assertEquals(isError(result), true);
    assertEquals((result as { error: string }).error, `User profile for ${userC} not found.`);
    console.log(`  Verified: Setting name for ${userC} correctly returned an error.`);
  });

  await t.step("Action: setImage - Successful image setting (effects)", async () => {
    console.log("\n--- Testing setImage (Success) ---");
    const result = await userProfileConcept.setImage({ user: userA, image: "http://example.com/alice.png" });
    assertEquals(result, {});
    const profile = await userProfileConcept._getUserProfile({ user: userA });
    assertFalse(isError(profile));
    assertEquals(profile[0].profile, "http://example.com/alice.png");
    console.log(`  Verified: Profile image for ${userA} set to "http://example.com/alice.png".`);
  });

  await t.step("Action: setImage - Non-existent user (requires)", async () => {
    console.log("\n--- Testing setImage (Non-existent user) ---");
    const result = await userProfileConcept.setImage({ user: userC, image: "http://example.com/charlie.png" });
    assertNotEquals(result, {});
    assertEquals(isError(result), true);
    assertEquals((result as { error: string }).error, `User profile for ${userC} not found.`);
    console.log(`  Verified: Setting image for ${userC} correctly returned an error.`);
  });

  await t.step("Action: setHobby - Add a new hobby (effects)", async () => {
    console.log("\n--- Testing setHobby (New hobby) ---");
    await userProfileConcept.createProfile({ user: userB }); // Create userB profile first
    const result = await userProfileConcept.setHobby({ user: userB, hobby: "Reading" });
    assertEquals(result, {});
    const hobbies = await userProfileConcept._getUserHobbies({ user: userB });
    assertFalse(isError(hobbies));
    assertArrayIncludes(hobbies as { hobby: string; active: boolean }[], [{ hobby: "Reading", active: true }]);
    console.log(`  Verified: Hobby "Reading" added as active for ${userB}.`);
  });

  await t.step("Action: setHobby - Add another new hobby", async () => {
    console.log("\n--- Testing setHobby (Another new hobby) ---");
    const result = await userProfileConcept.setHobby({ user: userB, hobby: "Coding" });
    assertEquals(result, {});
    const activeHobbies = await userProfileConcept._getActiveHobbies({ user: userB });
    assertFalse(isError(activeHobbies));
    assertEquals(activeHobbies.length, 2);
    assertArrayIncludes(activeHobbies as { hobby: string }[], [{ hobby: "Reading" }, { hobby: "Coding" }]);
    console.log(`  Verified: Hobby "Coding" added as active for ${userB}.`);
  });

  await t.step("Action: setHobby - Add an already active hobby (requires)", async () => {
    console.log("\n--- Testing setHobby (Already active hobby) ---");
    const result = await userProfileConcept.setHobby({ user: userB, hobby: "Reading" });
    assertNotEquals(result, {});
    assertEquals(isError(result), true);
    assertEquals((result as { error: string }).error, `Hobby 'Reading' is already active for user ${userB}.`);
    console.log(`  Verified: Adding already active hobby "Reading" for ${userB} correctly returned an error.`);
  });

  await t.step("Action: closeHobby - Deactivate a hobby (effects)", async () => {
    console.log("\n--- Testing closeHobby (Success) ---");
    const result = await userProfileConcept.closeHobby({ user: userB, hobby: "Reading" });
    assertEquals(result, {});
    const hobbies = await userProfileConcept._getUserHobbies({ user: userB });
    assertFalse(isError(hobbies));
    const readingHobby = (hobbies as { hobby: string; active: boolean }[]).find(h => h.hobby === "Reading");
    assertEquals(readingHobby?.active, false);
    const activeHobbies = await userProfileConcept._getActiveHobbies({ user: userB });
    assertFalse(isError(activeHobbies));
    assertEquals(activeHobbies.length, 1);
    assertArrayIncludes(activeHobbies as { hobby: string }[], [{ hobby: "Coding" }]);
    console.log(`  Verified: Hobby "Reading" is now inactive for ${userB}.`);
  });

  await t.step("Action: setHobby - Reactivate an inactive hobby (effects)", async () => {
    console.log("\n--- Testing setHobby (Reactivate inactive) ---");
    const result = await userProfileConcept.setHobby({ user: userB, hobby: "Reading" });
    assertEquals(result, {});
    const hobbies = await userProfileConcept._getUserHobbies({ user: userB });
    assertFalse(isError(hobbies));
    const readingHobby = (hobbies as { hobby: string; active: boolean }[]).find(h => h.hobby === "Reading");
    assertEquals(readingHobby?.active, true);
    const activeHobbies = await userProfileConcept._getActiveHobbies({ user: userB });
    assertFalse(isError(activeHobbies));
    assertEquals(activeHobbies.length, 2);
    assertArrayIncludes(activeHobbies as { hobby: string }[], [{ hobby: "Reading" }, { hobby: "Coding" }]);
    console.log(`  Verified: Hobby "Reading" reactivated for ${userB}.`);
  });

  await t.step("Action: closeHobby - Already inactive hobby (requires)", async () => {
    console.log("\n--- Testing closeHobby (Already inactive) ---");
    // First, close it
    await userProfileConcept.closeHobby({ user: userB, hobby: "Reading" });
    console.log(`  Hobby "Reading" closed for ${userB}.`); // Log for trace clarity
    // Then try to close it again
    const result = await userProfileConcept.closeHobby({ user: userB, hobby: "Reading" });
    assertNotEquals(result, {});
    assertEquals(isError(result), true);
    assertEquals((result as { error: string }).error, `Hobby 'Reading' is already inactive for user ${userB}.`);
    console.log(`  Verified: Closing already inactive hobby "Reading" for ${userB} correctly returned an error.`);
  });

  await t.step("Action: closeHobby - Non-existent hobby (requires)", async () => {
    console.log("\n--- Testing closeHobby (Non-existent hobby) ---");
    const result = await userProfileConcept.closeHobby({ user: userB, hobby: "Gardening" });
    assertNotEquals(result, {});
    assertEquals(isError(result), true);
    assertEquals((result as { error: string }).error, `Hobby 'Gardening' not found for user ${userB}.`);
    console.log(`  Verified: Closing non-existent hobby "Gardening" for ${userB} correctly returned an error.`);
  });

  await t.step("Action: closeHobby - Non-existent user (requires)", async () => {
    console.log("\n--- Testing closeHobby (Non-existent user) ---");
    const result = await userProfileConcept.closeHobby({ user: userC, hobby: "Playing" });
    assertNotEquals(result, {});
    assertEquals(isError(result), true);
    assertEquals((result as { error: string }).error, `User profile for ${userC} not found.`);
    console.log(`  Verified: Closing hobby for non-existent user ${userC} correctly returned an error.`);
  });

  await t.step("Action: closeProfile - Deactivate profile (effects)", async () => {
    console.log("\n--- Testing closeProfile (Success) ---");
    const result = await userProfileConcept.closeProfile({ user: userA });
    assertEquals(result, {});
    const profile = await userProfileConcept._getUserProfile({ user: userA });
    assertFalse(isError(profile));
    assertEquals(profile[0].active, false);
    console.log(`  Verified: Profile for ${userA} is now inactive.`);
  });

  await t.step("Action: closeProfile - Already inactive profile", async () => {
    console.log("\n--- Testing closeProfile (Already inactive) ---");
    // Profile A is already inactive from previous test. Attempt to close again.
    const result = await userProfileConcept.closeProfile({ user: userA });
    // This action `updateOne` with $set: {active: false} will match but not modify
    // if `active` is already false. `matchedCount` will be 1, `modifiedCount` will be 0.
    // The current implementation only checks matchedCount. This is a subtle point.
    // For this concept, re-setting an already false flag to false is often considered
    // a successful no-op rather than an error.
    assertEquals(result, {});
    console.log(`  Verified: Closing already inactive profile for ${userA} returned success (as no-op).`);
  });

  await t.step("Action: closeProfile - Non-existent user (requires)", async () => {
    console.log("\n--- Testing closeProfile (Non-existent user) ---");
    const result = await userProfileConcept.closeProfile({ user: userC });
    assertNotEquals(result, {});
    assertEquals(isError(result), true);
    assertEquals((result as { error: string }).error, `User profile for ${userC} not found.`);
    console.log(`  Verified: Closing profile for non-existent user ${userC} correctly returned an error.`);
  });

  await t.step("Principle: After setting name, hobby, image, others can see them", async () => {
    console.log("\n--- Testing Principle: User Profile Visibility ---");

    // Re-create userA and userB to ensure a clean state for the principle test
    await db.collection("UserProfile.userProfiles").deleteMany({});
    await db.collection("UserProfile.userHobbies").deleteMany({});
    await userProfileConcept.createProfile({ user: userA });
    await userProfileConcept.createProfile({ user: userB }); // Another user to simulate "others"

    console.log(`\nTrace for ${userA}:`);
    console.log("  1. Setting name for userA...");
    await userProfileConcept.setName({ user: userA, displayname: "Principle Alice" });

    console.log("  2. Setting image for userA...");
    await userProfileConcept.setImage({ user: userA, image: "http://example.com/principle_alice.jpg" });

    console.log("  3. Setting hobbies for userA...");
    await userProfileConcept.setHobby({ user: userA, hobby: "Painting" });
    await userProfileConcept.setHobby({ user: userA, hobby: "Hiking" });

    console.log("  4. User B (or any other viewer) queries user A's profile:");
    const aliceProfile = await userProfileConcept._getUserProfile({ user: userA });
    assertFalse(isError(aliceProfile));
    assertObjectMatch(aliceProfile[0], {
      _id: userA,
      active: true,
      displayname: "Principle Alice",
      profile: "http://example.com/principle_alice.jpg",
    });
    console.log(`    Query Result (UserProfile): ${JSON.stringify(aliceProfile[0])}`);

    const aliceHobbies = await userProfileConcept._getUserHobbies({ user: userA });
    assertFalse(isError(aliceHobbies));
    assertEquals(aliceHobbies.length, 2);
    assertArrayIncludes(aliceHobbies as { hobby: string; active: boolean }[], [
      { hobby: "Painting", active: true },
      { hobby: "Hiking", active: true },
    ]);
    console.log(`    Query Result (UserHobbies): ${JSON.stringify(aliceHobbies)}`);

    const aliceActiveHobbies = await userProfileConcept._getActiveHobbies({ user: userA });
    assertFalse(isError(aliceActiveHobbies));
    assertEquals(aliceActiveHobbies.length, 2);
    assertArrayIncludes(aliceActiveHobbies as { hobby: string }[], [
      { hobby: "Painting" },
      { hobby: "Hiking" },
    ]);
    console.log(`    Query Result (ActiveHobbies): ${JSON.stringify(aliceActiveHobbies)}`);

    console.log(`\nPrinciple Verified: After setting name, hobby, and image for ${userA}, all details are visible via queries.`);
  });

  await client.close();
});
```

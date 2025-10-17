import { assertEquals, assertThrows } from "testing/asserts";
import { getDb } from "@utils/database.ts";
import { freshID } from "@utils/database.ts";
import { UserProfileConcept } from "./UserProfileConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("User Profile Concept Tests", async (t) => {
  // Initialize concept with test database
  const db = await getDb();
  const concept = new UserProfileConcept(db);

  // Drop the collection before tests
  await db.collection("UserProfile.profiles").drop().catch(() => {});

  await t.step("Operational Principle: Create and Manage Profile", async () => {
    // Create a new profile
    const userId = freshID() as ID;
    const displayName = "HobbyEnthusiast";
    const bio = "I love learning new hobbies!";
    const profileId = await concept.createProfile(userId, displayName, bio);

    console.log("✓ Created profile:", { profileId, displayName });

    // Update profile information
    const newBio = "Passionate about learning and sharing hobbies";
    await concept.updateProfile(profileId, { bio: newBio });
    console.log("✓ Updated profile bio");

    // Add interests
    await concept.addInterest(profileId, "Photography");
    await concept.addInterest(profileId, "Gardening");
    console.log("✓ Added interests");

    // Update skill levels
    await concept.updateSkillLevel(profileId, "Photography", 3);
    await concept.updateSkillLevel(profileId, "Gardening", 2);
    console.log("✓ Updated skill levels");

    // Get and verify profile
    const profile = await concept.getProfile(profileId);
    assertEquals(profile.bio, newBio);
    assertEquals(profile.interests.length, 2);
    assertEquals(profile.skillLevels["Photography"], 3);
    console.log("✓ Verified profile data");
  });

  await t.step("Scenario: Unique Display Name", async () => {
    const displayName = "UniqueUser";

    // Create first profile
    await concept.createProfile(freshID() as ID, displayName, "Bio 1");
    console.log("✓ Created first profile");

    // Try to create profile with same display name
    await assertThrows(
      () => concept.createProfile(freshID() as ID, displayName, "Bio 2"),
      Error,
      "Display name is already taken",
    );
    console.log("✓ Prevented duplicate display name");
  });

  await t.step("Scenario: Bio Length Limit", async () => {
    const longBio = "a".repeat(501);

    // Try to create profile with too long bio
    await assertThrows(
      () => concept.createProfile(freshID() as ID, "ValidName", longBio),
      Error,
      "Bio cannot exceed 500 characters",
    );
    console.log("✓ Prevented too long bio");
  });

  await t.step("Scenario: Skill Level Range", async () => {
    const profileId = await concept.createProfile(
      freshID() as ID,
      "SkillTester",
      "Testing skills",
    );

    // Try invalid skill levels
    await assertThrows(
      () => concept.updateSkillLevel(profileId, "Hobby", 0),
      Error,
      "Skill level must be between 1 and 5",
    );

    await assertThrows(
      () => concept.updateSkillLevel(profileId, "Hobby", 6),
      Error,
      "Skill level must be between 1 and 5",
    );

    console.log("✓ Validated skill level range");
  });

  await t.step("Scenario: Interest Management", async () => {
    const profileId = await concept.createProfile(
      freshID() as ID,
      "HobbyManager",
      "Managing hobbies",
    );

    // Add interests
    await concept.addInterest(profileId, "Chess");
    await concept.addInterest(profileId, "Painting");

    // Get profile and verify interests
    let profile = await concept.getProfile(profileId);
    assertEquals(profile.interests.length, 2);
    console.log("✓ Added interests");

    // Remove an interest
    await concept.removeInterest(profileId, "Chess");

    // Verify removal
    profile = await concept.getProfile(profileId);
    assertEquals(profile.interests.length, 1);
    assertEquals(profile.interests[0], "Painting");
    console.log("✓ Removed interest");
  });

  // Clean up - drop the collection after tests
  await db.collection("UserProfile.profiles").drop().catch(() => {});
});

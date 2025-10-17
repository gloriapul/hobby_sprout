[@implementation](UserProfile.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: UserProfile
# response:

# file: src/concepts/UserProfileConcept.test.ts

```typescript
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserProfileConcept from "./UserProfileConcept.ts";
import { ID } from "@utils/types.ts";

const userA = "user:Alice" as ID;

/**
 * Test 1: Basic Profile Creation and Info Management
 * Demonstrates creating a profile and setting basic information
 */
Deno.test("Principle: Create profile and set basic information", async () => {
  const [db, client] = await testDb();
  const profileConcept = new UserProfileConcept(db);

  try {
    // 1. Create a new profile
    const createResult = await profileConcept.createProfile({ user: userA });
    assertEquals(
      "error" in createResult,
      false,
      "Profile creation should succeed"
    );

    // 2. Set display name
    const setNameResult = await profileConcept.setName({
      user: userA,
      displayname: "HobbyEnthusiast",
    });
    assertEquals(
      "error" in setNameResult,
      false,
      "Setting display name should succeed"
    );

    // 3. Set profile image
    const setImageResult = await profileConcept.setImage({
      user: userA,
      image: "https://example.com/profile.jpg",
    });
    assertEquals(
      "error" in setImageResult,
      false,
      "Setting profile image should succeed"
    );

    // 4. Verify profile information
    const profileResult = await profileConcept._getUserProfile({ user: userA });
    assertEquals(
      "error" in profileResult,
      false,
      "Getting profile should succeed"
    );
    if (!("error" in profileResult)) {
      assertEquals(profileResult[0].displayname, "HobbyEnthusiast");
      assertEquals(profileResult[0].profile, "https://example.com/profile.jpg");
      assertEquals(profileResult[0].active, true);
    }
  } finally {
    await client.close();
  }
});

/**
 * Test 2: Hobby Management
 * Demonstrates setting and closing hobbies for a user
 */
Deno.test("Principle: Manage user hobbies", async () => {
  const [db, client] = await testDb();
  const profileConcept = new UserProfileConcept(db);

  try {
    // 1. Create profile for hobby management
    await profileConcept.createProfile({ user: userA });

    // 2. Set a hobby
    const setHobbyResult = await profileConcept.setHobby({
      user: userA,
      hobby: "Photography",
    });
    assertEquals(
      "error" in setHobbyResult,
      false,
      "Setting hobby should succeed"
    );

    // 3. Try to set same hobby again (should fail)
    const duplicateResult = await profileConcept.setHobby({
      user: userA,
      hobby: "Photography",
    });
    assertEquals(
      "error" in duplicateResult,
      true,
      "Setting duplicate hobby should fail"
    );

    // 4. Close the hobby
    const closeResult = await profileConcept.closeHobby({
      user: userA,
      hobby: "Photography",
    });
    assertEquals(
      "error" in closeResult,
      false,
      "Closing hobby should succeed"
    );

  } finally {
    await client.close();
  }
});

/**
 * Test 3: Profile Lifecycle
 * Demonstrates creating and closing user profiles
 */
Deno.test("Principle: Profile lifecycle management", async () => {
  const [db, client] = await testDb();
  const profileConcept = new UserProfileConcept(db);

  try {
    // 1. Create a new profile
    await profileConcept.createProfile({ user: userA });

    // 2. Verify cannot create duplicate profile
    const duplicateResult = await profileConcept.createProfile({ user: userA });
    assertEquals(
      "error" in duplicateResult,
      true,
      "Creating duplicate profile should fail"
    );

    // 3. Close the profile
    const closeResult = await profileConcept.closeProfile({ user: userA });
    assertEquals(
      "error" in closeResult,
      false,
      "Closing profile should succeed"
    );

    // 4. Verify profile is inactive
    const profileResult = await profileConcept._getUserProfile({ user: userA });
    if (!("error" in profileResult)) {
      assertEquals(profileResult[0].active, false, "Profile should be inactive");
    }
  } finally {
    await client.close();
  }
});
```
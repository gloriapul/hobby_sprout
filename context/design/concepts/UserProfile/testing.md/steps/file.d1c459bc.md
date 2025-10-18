---
timestamp: 'Sat Oct 18 2025 18:53:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_185350.e383233e.md]]'
content_id: d1c459bc98c5299482b96fe3e60f485904cfe741ac3a51ea5ed1d073f9cbca5d
---

# file: src/concepts/UserProfileConcept.test.ts

```typescript
import { assertEquals } from "@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserProfileConcept from "./UserProfileConcept.ts";

const userA = "user:Alice" as ID;

Deno.test("Principle: User creates profile, adds personal information, and other users can see it", async () => {
  const [db, client] = await testDb();
  const profileConcept = new UserProfileConcept(db);

  try {
    console.log("1. Creating a new user profile");
    const createResult = await profileConcept.createProfile({ user: userA });
    assertEquals(
      "error" in createResult,
      false,
      "Profile creation should succeed",
    );
    console.log(`   ✓ Profile created successfully for user: ${userA}`);

    console.log("2. Setting display name for the profile");
    const setNameResult = await profileConcept.setName({
      user: userA,
      displayname: "HobbyEnthusiast",
    });
    assertEquals(
      "error" in setNameResult,
      false,
      "Setting display name should succeed",
    );
    console.log(`   ✓ Display name set to "HobbyEnthusiast"`);

    console.log("3. Setting profile image for the profile");
    const setImageResult = await profileConcept.setImage({
      user: userA,
      image: "https://example.com/profile.jpg", // use link to image address in real example
    });
    assertEquals(
      "error" in setImageResult,
      false,
      "Setting profile image should succeed",
    );
    console.log(`   ✓ Profile image set successfully`);

    console.log("4. Verifying user profile information");
    const profileResult = await profileConcept._getUserProfile({ user: userA });
    assertEquals(
      "error" in profileResult,
      false,
      "Getting profile should succeed",
    );
    if (!("error" in profileResult)) {
      assertEquals(profileResult[0].displayname, "HobbyEnthusiast");
      assertEquals(profileResult[0].profile, "https://example.com/profile.jpg");
      assertEquals(profileResult[0].active, true);
      console.log(
        `   ✓ Profile verification successful: User has correct name, image, and active status`,
      );
      console.log(
        "5. Principle satisfied: User profile created and information is visible",
      );
    }
  } finally {
    await client.close();
  }
});


Deno.test("Action: setHobby/closeHobby manages hobby assignments and status", async () => {
  const [db, client] = await testDb();
  const profileConcept = new UserProfileConcept(db);

  try {
    console.log("1. Creating a profile for hobby management");

    await profileConcept.createProfile({ user: userA });
    console.log(`   ✓ Profile created successfully for user: ${userA}`);

    console.log("2. Adding a hobby to the user profile"); // could be determined from quiz in real example

    const setHobbyResult = await profileConcept.setHobby({
      user: userA,
      hobby: "Photography",
    });
    assertEquals(
      "error" in setHobbyResult,
      false,
      "Setting hobby should succeed",
    );
    console.log(`   ✓ Hobby "Photography" added successfully`);

    console.log(
      "3. Testing hobby uniqueness - attempting to add same hobby again",
    );
    const duplicateResult = await profileConcept.setHobby({
      user: userA,
      hobby: "Photography",
    });
    assertEquals(
      "error" in duplicateResult,
      true,
      "Setting duplicate hobby should fail",
    );
    if ("error" in duplicateResult) {
      console.log(
        `   ✓ Duplicate hobby correctly rejected with error: "${duplicateResult.error}"`,
      );
    }

    console.log("4. Closing a hobby");

    const closeResult = await profileConcept.closeHobby({
      user: userA,
      hobby: "Photography",
    });
    assertEquals(
      "error" in closeResult,
      false,
      "Closing hobby should succeed",
    );
    console.log(`   ✓ Hobby "Photography" closed successfully`);
    console.log(
      "5. Action requirements satisfied: setHobby and closeHobby work correctly with proper validation",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: createProfile/closeProfile enforces profile uniqueness and lifecycle", async () => {
  const [db, client] = await testDb();
  const profileConcept = new UserProfileConcept(db);

  try {
    console.log("1. Creating a user profile");

    const createResult = await profileConcept.createProfile({ user: userA });
    assertEquals(
      "error" in createResult,
      false,
      "Profile creation should succeed",
    );
    console.log(`   ✓ Profile created successfully for user: ${userA}`);

    console.log(
      "2. Testing profile uniqueness - attempting to create duplicate profile",
    );

    const duplicateResult = await profileConcept.createProfile({ user: userA });
    assertEquals(
      "error" in duplicateResult,
      true,
      "Creating duplicate profile should fail",
    );
    if ("error" in duplicateResult) {
      console.log(
        `   ✓ Duplicate profile correctly rejected with error: "${duplicateResult.error}"`,
      );
    }

    console.log("3. Closing the user profile");

    const closeResult = await profileConcept.closeProfile({ user: userA });
    assertEquals(
      "error" in closeResult,
      false,
      "Closing profile should succeed",
    );
    console.log(`   ✓ Profile closed successfully`);

    console.log("4. Verifying profile inactive status");

    const profileResult = await profileConcept._getUserProfile({ user: userA });
    if (!("error" in profileResult)) {
      assertEquals(
        profileResult[0].active,
        false,
        "Profile should be inactive",
      );
      console.log(`   ✓ Profile verified as inactive`);
      console.log(
        "5. Action requirements satisfied: Profile creation enforces uniqueness and profiles can be closed",
      );
    }
  } finally {
    await client.close();
  }
});
```

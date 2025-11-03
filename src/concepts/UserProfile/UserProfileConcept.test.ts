import { assertEquals } from "@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserProfileConcept from "./UserProfileConcept.ts";

const userA = "user:Alice" as ID;

Deno.test("Principle: User creates profile, adds personal information", async () => {
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
      console.log(
        `   ✓ Profile verification successful: User has correct name and image`,
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

Deno.test("Action: createProfile/deleteProfile enforces profile uniqueness and lifecycle", async () => {
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

    console.log("3. Deleting the user profile");

    const deleteResult = await profileConcept.deleteProfile({ user: userA });
    assertEquals(
      "error" in deleteResult,
      false,
      "Deleting profile should succeed",
    );
    console.log(`   ✓ Profile deleted successfully`);

    console.log("4. Verifying profile is permanently removed");

    const profileResult = await profileConcept._getUserProfile({ user: userA });
    assertEquals(
      "error" in profileResult,
      true,
      "Profile should not exist after deletion",
    );
    console.log(`   ✓ Profile verified as permanently removed`);
    console.log(
      "5. Action requirements satisfied: Profile creation enforces uniqueness and profiles can be deleted",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteProfile permanently removes profile and associated data", async () => {
  const [db, client] = await testDb();
  const profileConcept = new UserProfileConcept(db);

  try {
    console.log("1. Creating a user profile with hobbies");
    await profileConcept.createProfile({ user: userA });
    await profileConcept.setName({ user: userA, displayname: "TestUser" });
    await profileConcept.setHobby({ user: userA, hobby: "Photography" });
    await profileConcept.setHobby({ user: userA, hobby: "Hiking" });
    console.log(`   ✓ Profile created with name and 2 hobbies`);

    console.log("2. Verifying profile and hobbies exist");
    const profileBefore = await profileConcept._getUserProfile({ user: userA });
    const hobbiesBefore = await profileConcept._getUserHobbies({ user: userA });
    assertEquals("error" in profileBefore, false, "Profile should exist");
    if (!("error" in hobbiesBefore)) {
      assertEquals(hobbiesBefore.length, 2, "Should have 2 hobbies");
      console.log(`   ✓ Profile and ${hobbiesBefore.length} hobbies verified`);
    }

    console.log("3. Deleting the user profile");
    const deleteResult = await profileConcept.deleteProfile({ user: userA });
    assertEquals(
      "error" in deleteResult,
      false,
      "Deleting profile should succeed",
    );
    console.log(`   ✓ Profile deleted successfully`);

    console.log("4. Verifying profile and hobbies are permanently removed");
    const profileAfter = await profileConcept._getUserProfile({ user: userA });
    const hobbiesAfter = await profileConcept._getUserHobbies({ user: userA });
    assertEquals(
      "error" in profileAfter,
      true,
      "Profile should not exist after deletion",
    );
    assertEquals(
      "error" in hobbiesAfter,
      true,
      "Hobbies query should fail after profile deletion",
    );
    console.log(`   ✓ Profile and all associated data permanently removed`);

    console.log("5. Attempting to delete non-existent profile");
    const deleteAgain = await profileConcept.deleteProfile({ user: userA });
    assertEquals(
      "error" in deleteAgain,
      true,
      "Deleting non-existent profile should fail",
    );
    if ("error" in deleteAgain) {
      console.log(
        `   ✓ Correctly rejected with error: "${deleteAgain.error}"`,
      );
    }

    console.log(
      "6. Action requirements satisfied: deleteProfile removes all user data permanently",
    );
  } finally {
    await client.close();
  }
});

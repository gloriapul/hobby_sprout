import { assertEquals, assertThrows } from "testing/asserts";
import { ObjectId } from "mongodb";
import { getDb } from "@utils/database.ts";
import { PasswordAuthConcept } from "./PasswordAuthConcept.ts";

Deno.test("Password Authentication Concept Tests", async (t) => {
  // Initialize the concept with a test database
  const [client, dbName] = await getDb();
  const db = client.db(dbName);
  const concept = new PasswordAuthConcept(db);

  // Drop the collection before tests
  await db.collection("users").drop().catch(() => {});

  await t.step(
    "Operational Principle: Register, Login, Change Password",
    async () => {
      // Register a new user
      const username = "testuser";
      const password = "password123";
      const userId = await concept.register(username, password);

      console.log("✓ Registered user:", { username, userId });

      // Login with correct credentials
      const loggedInUserId = await concept.login(username, password);
      assertEquals(loggedInUserId, userId);
      console.log("✓ Logged in successfully");

      // Change password
      const newPassword = "newpassword123";
      await concept.changePassword(userId, password, newPassword);
      console.log("✓ Changed password");

      // Verify can login with new password
      const reloggedInUserId = await concept.login(username, newPassword);
      assertEquals(reloggedInUserId, userId);
      console.log("✓ Logged in with new password");
    },
  );

  await t.step("Scenario: Username must be unique", async () => {
    const username = "uniqueuser";
    const password = "password123";

    // Register first user
    await concept.register(username, password);
    console.log("✓ Registered first user");

    // Attempt to register same username
    await assertThrows(
      () => concept.register(username, "differentpassword"),
      Error,
      "Username already exists",
    );
    console.log("✓ Prevented duplicate username");
  });

  await t.step("Scenario: Password requirements", async () => {
    // Try to register with short password
    await assertThrows(
      () => concept.register("newuser", "short"),
      Error,
      "Password must be at least 8 characters long",
    );
    console.log("✓ Prevented short password");
  });

  await t.step("Scenario: Failed login attempts", async () => {
    const username = "secureuser";
    const password = "correctpassword";

    // Register user
    await concept.register(username, password);

    // Try wrong password
    await assertThrows(
      () => concept.login(username, "wrongpassword"),
      Error,
      "Invalid username or password",
    );
    console.log("✓ Failed login with wrong password");

    // Try non-existent username
    await assertThrows(
      () => concept.login("nonexistent", password),
      Error,
      "Invalid username or password",
    );
    console.log("✓ Failed login with non-existent username");
  });

  await t.step("Scenario: Change password validation", async () => {
    const username = "pwduser";
    const password = "originalpass123";

    // Register user
    const userId = await concept.register(username, password);

    // Try changing with wrong old password
    await assertThrows(
      () => concept.changePassword(userId, "wrongold", "newpass123"),
      Error,
      "Invalid current password",
    );
    console.log("✓ Prevented password change with wrong current password");

    // Try changing to short password
    await assertThrows(
      () => concept.changePassword(userId, password, "short"),
      Error,
      "New password must be at least 8 characters long",
    );
    console.log("✓ Prevented changing to short password");
  });

  // Clean up - drop the collection after tests
  await db.collection("users").drop();
  await client.close();
});

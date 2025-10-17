import { assertEquals } from "@std/assert";
import { testDb } from "@utils/database.ts";
import PasswordAuthenticationConcept from "./PasswordAuthenticationConcept.ts";
import { ID } from "@utils/types.ts";

type AuthResult = { user: ID } | { error: string };

/**
 * Principle: If a user registers with a unique username and a password, they can subsequently
 * authenticate with those same credentials and will be recognized as the same user.
 *
 * Test demonstrates:
 * 1. A user can register with a unique username and password
 * 2. The same user can authenticate with those credentials
 * 3. Authentication returns the same user ID from registration
 */
Deno.test("Password Authentication - Basic Flow", async () => {
  const [db, client] = await testDb();
  const concept = new PasswordAuthenticationConcept(db);

  try {
    // Register a new user
    const username = "testuser";
    const password = "password123";
    const registerResult = await concept.register({
      username,
      password,
    }) as AuthResult;
    if ("error" in registerResult) {
      throw new Error(registerResult.error);
    }
    const userId = registerResult.user;

    // Authenticate with correct credentials
    const authResult = await concept.authenticate({
      username,
      password,
    }) as AuthResult;
    if ("error" in authResult) {
      throw new Error(authResult.error);
    }
    assertEquals(authResult.user, userId);
  } finally {
    await client.close();
  }
});

/**
 * Action: register(username, password)
 *
 * Requires: no User with the given username already exists
 *
 * Test verifies:
 * 1. First registration with a username succeeds
 * 2. Second registration with the same username fails
 * 3. Appropriate error message is returned
 */
Deno.test("Password Authentication - Username Uniqueness", async () => {
  const [db, client] = await testDb();
  const concept = new PasswordAuthenticationConcept(db);

  try {
    const username = "uniqueuser";
    const password = "password123";

    // Register first user
    const result1 = await concept.register({
      username,
      password,
    }) as AuthResult;
    if ("error" in result1) {
      throw new Error(result1.error);
    }

    // Attempt to register same username
    const result2 = await concept.register({
      username,
      password: "differentpassword",
    }) as AuthResult;
    if (!("error" in result2)) {
      throw new Error("Expected error but got success");
    }
    const errorResult = result2 as { error: string };
    assertEquals(errorResult.error, `Username '${username}' is already taken.`);
  } finally {
    await client.close();
  }
});

/**
 * Action: authenticate(username, password)
 *
 * Requires: a User with the given username exists AND
 * the password matches the stored password for that user
 *
 * Test verifies:
 * 1. Authentication fails with incorrect password
 * 2. Authentication fails with non-existent username
 * 3. Error messages maintain security by not revealing specific cause
 */
Deno.test("Password Authentication - Failed Authentication", async () => {
  const [db, client] = await testDb();
  const concept = new PasswordAuthenticationConcept(db);

  try {
    const username = "secureuser";
    const password = "correctpassword";

    // Register user
    const registerResult = await concept.register({
      username,
      password,
    }) as AuthResult;
    if ("error" in registerResult) {
      throw new Error(registerResult.error);
    }

    // Try wrong password
    const wrongPasswordResult = await concept.authenticate({
      username,
      password: "wrongpassword",
    }) as AuthResult;
    if (!("error" in wrongPasswordResult)) {
      throw new Error("Expected error but got success");
    }
    assertEquals(wrongPasswordResult.error, "Invalid username or password.");

    // Try non-existent username
    const nonExistentResult = await concept.authenticate({
      username: "nonexistent",
      password,
    }) as AuthResult;
    if (!("error" in nonExistentResult)) {
      throw new Error("Expected error but got success");
    }
    assertEquals(nonExistentResult.error, "Invalid username or password.");
  } finally {
    await client.close();
  }
});

import { Db, ObjectId } from "mongodb";
import * as bcrypt from "bcrypt";
import { getDb } from "@utils/database.ts";

export interface User {
  _id: ObjectId;
  username: string;
  hashedPassword: string;
  salt: string;
}

export class PasswordAuthConcept {
  private db: Db;
  private collection: string = "users";

  constructor(db: Db) {
    this.db = db;
  }

  private async generateSalt(): Promise<string> {
    return await bcrypt.genSalt(10);
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return await bcrypt.hash(password + salt);
  }

  async register(username: string, password: string): Promise<string> {
    // Input validation
    if (!username || !password) {
      throw new Error("Username and password are required");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Check if username is taken
    const existing = await this.db.collection(this.collection).findOne({
      username,
    });
    if (existing) {
      throw new Error("Username already exists");
    }

    // Generate salt and hash password
    const salt = await this.generateSalt();
    const hashedPassword = await this.hashPassword(password, salt);

    // Create new user
    const result = await this.db.collection(this.collection).insertOne({
      username,
      hashedPassword,
      salt,
    });

    return result.insertedId.toString();
  }

  async login(username: string, password: string): Promise<string> {
    const user = await this.db.collection(this.collection).findOne({
      username,
    });

    if (!user) {
      // Use same error message to not reveal if username exists
      throw new Error("Invalid username or password");
    }

    const hashedAttempt = await this.hashPassword(password, user.salt);
    if (hashedAttempt !== user.hashedPassword) {
      throw new Error("Invalid username or password");
    }

    return user._id.toString();
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    const user = await this.db.collection(this.collection).findOne({
      _id: new ObjectId(userId),
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Verify old password
    const hashedOldAttempt = await this.hashPassword(oldPassword, user.salt);
    if (hashedOldAttempt !== user.hashedPassword) {
      throw new Error("Invalid current password");
    }

    // Generate new salt and hash for the new password
    const newSalt = await this.generateSalt();
    const newHashedPassword = await this.hashPassword(newPassword, newSalt);

    await this.db.collection(this.collection).updateOne(
      { _id: new ObjectId(userId) },
      { $set: { hashedPassword: newHashedPassword, salt: newSalt } },
    );
  }
}

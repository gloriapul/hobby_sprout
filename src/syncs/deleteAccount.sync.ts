/**
 * Account Deletion Synchronization
 *
 * Ensures that when a user profile is deleted, their authentication
 * credentials are also removed, preventing login to a deleted account.
 */

import { PasswordAuthentication, UserProfile } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * When a profile is deleted, also delete the user's authentication credentials
 */
export const DeleteAccountSync: Sync = ({ user }) => ({
  when: actions([UserProfile.closeProfile, { user }]),
  then: actions([PasswordAuthentication.deleteUser, { user }]),
});

---
timestamp: 'Thu Oct 16 2025 21:41:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_214106.9ecf073d.md]]'
content_id: 9d792587c80ddb77ae0c9a5b0aaffe4b2c69c431ecc263bea00f22422990f7d3
---

# question: my concept was concept PasswordAuthentication

purpose limit access to known users
principle after a user registers with a username and a password, they can authenticate with that same username and password and be treated each time as the same user
state a set of Users with

a username String
a password String actions

register (username: String, password: String): (user: User)

requires the username to not already exist
effects create a new username with the corresponding password

authenticate (username: String, password: String): (user: User)

requires username to exist and for password to correspond to it

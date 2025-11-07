# HobbySprout Backend

This repository contains the backend server for the HobbySprout application, built with Deno, TypeScript, and MongoDB.

[6.104 Portfolio](https://github.com/gloriapul/61040-portfolio)

## Design Documentation

### Concept Specifications
- [PasswordAuthentication](design/concepts/PasswordAuthentication/PasswordAuthentication.md): Secure user authentication.
- [UserProfile](design/concepts/UserProfile/UserProfile.md): Manage user profile information and hobbies.
- [QuizMatchmaker](design/concepts/QuizMatchmaker/QuizMatchmaker.md): Match users with hobbies based on personality.
- [MilestoneTracker](design/concepts/MilestoneTracker/MilestoneTracker.md): Track progress on hobby-related goals.

### Design Evolution
- [Initial Design Changes](design/design-changes.md)
- [Changes After Assignment 4b](design/assignment4b-design-changes.md)
- [Final Design Document Assignment 4c](design/assignment4c-final-design-doc.md)

### Reflection
- [Assignment 4c Reflection](design/assignment4c-reflection.md)


### Trace
- [Render Trace](design/render-trace.md)


## Project Setup

Follow these steps to get the backend running locally.

### 1. Prerequisites
- **Fork this repository**: [Fork the repo](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo#forking-a-repository) and clone it to your local machine.
- **Install Deno**: Follow the instructions on the [official Deno website](https://deno.com). We recommend installing the [Deno VS Code extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno) as well.

### 2. Environment Configuration
- **Create a `.env` file**: Copy the `.env.template` file to a new file named `.env`.
  ```shell
  cp .env.template .env
  ```
- **Set up Gemini API Key**:
  - Get your API key from [Google AI Studio](https://ai.google.dev/).
  - Add it to your `.env` file:
    ```env
    GEMINI_API_KEY=YOUR_KEY_HERE
    ```
- **Set up MongoDB**:
  - Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
  - In the "Security Quickstart", ensure you allow network access from anywhere by adding the IP address `0.0.0.0/0`.
  - Get your connection string by clicking **CONNECT** -> **Drivers**.
  - Add the connection string and a database name to your `.env` file. Remember to replace `<password>` with your actual database user password.
    ```env
    MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.p82ijqd.mongodb.net/?retryWrites=true&w=majority
    DB_NAME=my-hobbysprout-db
    ```

---

## Running the Project

### 1. Build the Project
This command generates necessary import files for the concepts. You should run this once after the initial setup.
```shell
deno run build
```

### 2. Start the Server
This command starts the backend API server.
```shell
deno run start
```
The server will now be running and listening for requests on the configured port (the default is 8000).


# Generate Milestone Steps

Create a structured step-by-step plan for this goal: "Learn Docker"

# Requirements

1. Each step should be specific, complete, measurable, and actionable
2. Steps must be relevant to the goal and feasible for an average person
3. Steps must be in logical order
4. No filler steps
5. Steps must be returned as a JSON array of strings

Example:
["Research camera settings and features","Practice taking photos in different lighting","Review and organize test shots"]
# response:

```json
[
  "Install Docker Desktop (or Docker Engine) on your operating system and verify the installation by running `docker --version`.",
  "Complete an introductory tutorial on Docker's core concepts (images, containers, volumes, networks) and run your first 'Hello World' container.",
  "Practice managing container lifecycles by running, stopping, starting, restarting, and removing various containers using `docker run`, `ps`, `stop`, `start`, `rm` commands.",
  "Execute commands inside a running container and inspect its details using `docker exec` and `docker inspect` to understand its environment.",
  "Create a simple Dockerfile to build a custom image for a basic web application (e.g., Nginx serving an HTML page) and successfully build it using `docker build`.",
  "Practice tagging images with `docker tag`, listing local images with `docker images`, and removing unused images with `docker rmi`.",
  "Implement data persistence for a database container (e.g., PostgreSQL or MySQL) using both bind mounts and named volumes, demonstrating their usage.",
  "Create a custom bridge network and connect two containers (e.g., a web application and a database) to it, allowing them to communicate by name.",
  "Develop a `docker-compose.yml` file for a multi-service application (e.g., a backend API, a frontend, and a database) and manage its lifecycle with `docker-compose up` and `down`.",
  "Create a Docker Hub account, tag a custom image, and successfully push it to Docker Hub, then pull it back to a different environment or machine.",
  "Refactor an existing Dockerfile to incorporate best practices, such as multi-stage builds for smaller images, and optimize build context using `.dockerignore`.",
  "Successfully deploy a complete, containerized personal project or tutorial application (e.g., a To-Do app) using Docker Compose and verify its functionality."
]
```
# Social Media Platform - Microservices Architecture

This project is a fully-featured social media platform built using a microservices architecture. Each core functionality of the platform is encapsulated in its own independent service, communicating asynchronously through a message broker. This design ensures scalability, resilience, and maintainability.

## ✨ Features

* **User Authentication**: Secure user registration and login using JWT (JSON Web Tokens).
* **Post Management**: Create, view, update, and delete posts.
* **Media Uploads**: Attach images and videos to posts.
* **Full-Text Search**: Powerful search functionality to find posts based on content.
* **API Gateway**: A single entry point for all client requests, routing them to the appropriate microservice.
* **Asynchronous Communication**: Services communicate via RabbitMQ, ensuring loose coupling and fault tolerance.
* **Containerized**: Fully containerized with Docker and orchestrated with Docker Compose for easy setup and deployment.

---

## 🏛️ Architecture Overview

The application is composed of several distinct microservices, each with a specific responsibility. They communicate with each other through an **API Gateway** for synchronous requests and a **RabbitMQ** message broker for asynchronous events.

```
+-----------------+      +-----------------+      +--------------------+
|   Client App    |----->|   API Gateway   |----->|  Identity Service  |
+-----------------+      +-------+---------+      +--------------------+
                                 |
                                 |
           +---------------------+---------------------+
           |                     |                     |
+----------v----------+ +--------v--------+ +----------v----------+
|    Post Service     | |   Media Service | |    Search Service   |
+---------------------+ +-----------------+ +---------------------+
           ^                     ^                     ^
           |                     |                     |
           +---------------------+---------------------+
                                 |
                      +----------v----------+
                      |      RabbitMQ       |
                      |   (Event Broker)    |
                      +---------------------+
```

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Containerization**: Docker, Docker Compose
- **API Gateway**: Custom-built with Express.js
- **Messaging/Events**: RabbitMQ
- **Authentication**: JWT, bcrypt
- **Logging**: Winston

---

## 🔬 Microservices

This project consists of the following services:

| Service | Port | Description |
| :--- | :--- | :--- |
| 🚀 **API Gateway** | `3000` | The single entry point for all incoming client requests. It authenticates requests and routes them to the appropriate internal service. |
| 👤 **Identity Service** | `3001` | Handles user registration, login, and JWT token generation. Manages all user-related data. |
| 📝 **Post Service** | `3002` | Responsible for creating, updating, deleting, and retrieving posts. Publishes events when posts are created or deleted. |
| 🖼️ **Media Service** | `3003` | Manages uploading, storing, and retrieving media files (images/videos) associated with posts. |
| 🔍 **Search Service** | `3004` | Provides full-text search capabilities. It listens for events from the Post Service to keep its search index synchronized. |
| 🐰 **RabbitMQ** | `5672` | The message broker that enables asynchronous communication and event-driven choreography between services. |

---

## 🏁 Getting Started

To run this project locally, you will need to have Docker and Docker Compose installed on your machine.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone the Repository

```bash
git clone [https://github.com/sajaljn26/Microservices.git](https://github.com/sajaljn26/Microservices.git)
cd Microservices
```

### 2. Configure Environment Variables

Each service uses its own `.env` file for configuration. You need to create a `.env` file in the root directory of each of the following services:
- `api-gateway`
- `identity-service`
- `media-service`
- `post-service`
- `search-service`

Here is an example `.env` file. You can use these values for local development.

**Example `.env` for `identity-service`:**
```env
PORT=3001
MONGO_URI=mongodb://mongodb:27017/identity-db
JWT_SECRET=your_super_secret_key
RABBITMQ_URL=amqp://guest:guest@rabbitmq
```
* **`MONGO_URI`**: Use the service name `mongodb` as the host when running with Docker Compose.
* **`RABBITT_URL`**: Use the service name `rabbitmq` as the host.
* **`JWT_SECRET`**: Set a strong, unique secret key.

*Note: Create a similar `.env` file for each service, adjusting the `PORT` and `MONGO_URI` database name (`identity-db`, `post-db`, etc.) as needed.*

### 3. Build and Run the Application

Once the environment variables are set up, you can start the entire application with a single command from the root directory:

```bash
docker-compose up --build
```

This command will:
1.  Build the Docker image for each microservice.
2.  Start a container for each service, including MongoDB and RabbitMQ.
3.  Connect them on a shared Docker network.

The API Gateway will be available at `http://localhost:3000`.

### 4. Stopping the Application

To stop all the running containers, press `Ctrl + C` in the terminal where `docker-compose` is running, or run the following command from the project root:

```bash
docker-compose down
```

---

## 📄 API Endpoints

All requests should be made to the API Gateway on port `3000`.

### Identity Service

- `POST /api/v1/auth/register` - Register a new user.
- `POST /api/v1/auth/login` - Log in a user and receive a JWT token.

### Post Service

- `POST /api/v1/posts` - Create a new post (Requires Authentication).
- `GET /api/v1/posts/:id` - Get a specific post.
- `DELETE /api/v1/posts/:id` - Delete a post (Requires Authentication).

### Search Service

- `GET /api/v1/posts/search` - Search for posts (e.g., `/api/v1/posts/search?q=mysearchquery`).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/sajaljn26/Microservices/issues).

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

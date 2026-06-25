# DPhish — Cyber Threat & Phishing Intelligence Platform

This is the primary workspace directory for **DPhish**, a security awareness application featuring a real-time heuristics threat analyzer, security telemetry dashboard, and training quizzes.

For full architectural detail, logic breakdowns, and production deployment instructions, please refer to the **[Main Workspace README](../README.md)**.

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
The application will run locally at `http://localhost:5173`.

### 3. Build & Preview for Production
```bash
npm run build
npm run preview
```

---

## 🐳 Docker Production Setup

This application is built with a production-hardened multi-stage Docker environment running Nginx on port `8080` as a non-root user.

### Build the Image
```bash
docker build -t dphish-app .
```

### Run the Container
```bash
docker run -p 8080:8080 dphish-app
```
Then navigate to `http://localhost:8080` to access the application.

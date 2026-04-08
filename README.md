🚀 Distributed API Monitoring & Alerting System

A production-style, event-driven API monitoring platform that collects metrics, aggregates them in real-time, evaluates alert policies, and provides intelligent insights with an AI-powered explanation layer.


---

📌 Overview

This project is designed to simulate a real-world observability system used in modern backend infrastructures. It monitors API health, processes metrics asynchronously, and generates alerts based on configurable policies.

The system is fully containerized and deployed across multiple cloud services, showcasing modern full-stack and backend engineering practices.


---

🎯 Key Features

📡 Real-time API metric ingestion

⚙️ Event-driven architecture for processing

🔄 Asynchronous task execution using Celery & Redis

📊 Time-window based metric aggregation

🚨 Policy-based alert generation

🤖 AI-powered alert explanation (GenAI integration)

🐳 Dockerized backend services

☁️ Multi-cloud deployment (Backend, Frontend, DB separated)

🌐 Full-stack integration with responsive frontend



---

🧠 System Architecture

Client / API Calls
        ↓
Metric Ingestion API (Django)
        ↓
Redis Queue
        ↓
Celery Workers
        ↓
Aggregation (time windows)
        ↓
Policy Evaluation Engine
        ↓
Alert Generation
        ↓
(Optional) AI Explanation Layer
        ↓
Frontend Dashboard (Next.js)


---

⚙️ Tech Stack

🧩 Backend

Django

Django REST Framework

Celery (async task processing)

Redis (message broker)


🎨 Frontend

Next.js

React

TypeScript


🗄️ Database

PostgreSQL (Neon DB)


☁️ Deployment

Docker (containerization)

DigitalOcean (backend hosting)

Vercel (frontend hosting)


🤖 AI Integration

OpenAI API (for alert explanation)



---

🔄 Workflow Explained

1. Metric Ingestion

APIs send metrics (latency, error rate, throughput) to the backend.

2. Queueing

Metrics are pushed into Redis queues.

3. Asynchronous Processing

Celery workers consume tasks and process metrics without blocking the main server.

4. Aggregation

Metrics are grouped into fixed time windows (e.g., 1 minute) for analysis.

5. Policy Evaluation

Each aggregated metric is evaluated against predefined alert policies.

6. Alert Generation

Alerts are created when thresholds are breached.

7. AI Explanation (Enhancement)

Alerts can be analyzed using an AI model to:

Explain the issue

Suggest possible fixes



---

🐳 Docker Architecture

The system uses Docker Compose to orchestrate services:

web → Django backend (Gunicorn)

worker → Celery worker

beat → Celery scheduler

redis → Message broker


Run the system

docker-compose up --build

Stop the system

docker-compose down


---

☁️ Deployment Architecture

Component	Platform

Frontend	Vercel
Backend	DigitalOcean Droplet
Database	Neon PostgreSQL


This setup demonstrates a multi-cloud architecture, where services are decoupled and independently scalable.


---

🔐 Environment Variables

Create a .env file in the backend:

SECRET_KEY=your_secret_key
DATABASE_URL=your_neon_db_url
EMAIL_HOST_USER=your_email
EMAIL_HOST_PASSWORD=your_password


---

📊 Future Enhancements

📈 Interactive dashboards (Recharts)

🔑 API authentication & rate limiting

📉 Historical trend analysis

📦 Dead-letter queues for failed tasks

🧠 Advanced AI agent for root-cause analysis



---

🧾 Key Learnings

Designing event-driven systems

Handling asynchronous workloads

Debugging distributed systems

Containerization & deployment

Building production-style backend pipelines



---

💡 Deployment Note (Cost Optimization)

To optimize usage of Neon DB free-tier compute hours, the backend service is intentionally not kept running 24/7.

The backend can be quickly started using Docker when needed

This helps conserve limited database compute resources

Demonstrates practical awareness of cloud cost management in real-world systems



---

🖼️ Screenshots

All screenshots used in this README are available in the following directory:

frontend/public/

These include:

Docker containers (worker, beat, redis)

Metric monitoring (raw & aggregated)

Policy creation and alert generation

System behavior proofs



---

🏁 Conclusion

This project demonstrates how modern backend systems are built using asynchronous processing, event-driven design, and scalable cloud deployment.

It goes beyond a typical CRUD application by simulating real-world observability infrastructure with intelligent alerting capabilities.


---

👨‍💻 Author

Abhay


---

⭐ If you found this project interesting, feel free to star the repo!
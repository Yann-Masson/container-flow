# 🐳 Container Flow

**Container Flow** is a cross-platform desktop application for managing Docker containers hosted on a remote server.  
It provides a simple, graphical way to create, delete, duplicate, and manage containers — without needing deep technical knowledge.

## ✨ Features

Container Flow comes with different **profiles** depending on your needs:

### 🔹 Basic Profile

For general container management:

- List running containers
- Inspect configuration
- Create new containers
- Duplicate existing containers
- Delete containers

### 🔹 WordPress Profile

Designed for agencies, freelancers, and designers who want to manage multiple WordPress projects on a single server:

- **Reverse Proxy with Traefik**: Automatically route traffic to the correct WordPress container based on domain/subdomain.
- **MySQL Database**: Centralized database service for all your WordPress projects.
- **Monitoring Stack**: Preconfigured with cAdvisor, Prometheus, and Grafana for real-time insights (CPU, RAM, database usage, etc.).
- **WordPress Project Management**: Create, update, or delete entire WordPress projects with a few clicks.  
  Projects can scale across multiple containers to handle higher traffic.

> ⚠️ To use the WordPress profile properly, you must configure your DNS records to point to your server (e.g. `*.yourdomain.com`).

---

## 📥 Download

Grab the latest release for your platform here:  
👉 [Download Container Flow](https://github.com/Yann-Masson/container-flow/releases/latest)

Supported platforms: **Windows**, **macOS**, **Linux**

---

## 🚀 Usage

1. Download and install Container Flow.
2. Connect the app to your remote Docker server (via SSH).
3. Choose a profile (Basic or WordPress).
4. Start creating and managing containers visually!

---

## 🛠️ Development Setup

Clone the repository and install dependencies:

```bash
pnpm install
````

Start the development server:

```bash
pnpm dev
```

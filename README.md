# ⚡ Fluxbase


Fluxbase is your modern, self-hosted project and data management tool. It gives you a smooth, spreadsheet-like interface to manage projects, organize data, and keep everything in one place — with performance and simplicity in mind.

> ⚠ **Note:** Fluxbase is built to run **only on a dedicated server or your own computer**.  
> It will not work properly on platforms like Vercel, Render, Railway, or inside Docker containers, because those environments don't provide reliable local file storage.

---

## ✨ Features

- 🗂 **Multi-Project Management** – Create, switch, and organize multiple projects with ease.  
- 🔑 **Reliable Data Handling** – Every record has its own unique ID, so updates and deletes never break anything.  
- 🖥 **Clean & Modern UI** – Built with Next.js, Tailwind CSS, and shadcn/ui for a seamless experience.  
- ⚡ **Fast CRUD Operations** – Add, edit, delete, and view data instantly — no page reloads.  
- 🌐 **Self-Hosted** – Run it on your computer, VPS, or private server for full control.  
- 🔌 **Future-Friendly** – Easily extendable to connect to external databases or APIs later.  

---

## 📂 Project Structure

```
Fluxbase/
├── docs/                # Documentation and planning
├── src/
│   ├── ai/              # AI-related helpers and logic
│   ├── app/             # Next.js App Router pages & APIs
│   ├── components/      # Reusable UI building blocks
│   ├── database/        # Data storage & unique ID handling
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions & helpers
│   └── middleware.ts    # Session/auth middleware
├── next.config.ts       # Next.js configuration
├── package.json         # Dependencies & scripts
├── tailwind.config.ts   # Tailwind setup
├── tsconfig.json        # TypeScript configuration
└── README.md
```

---

## 🧩 Tech Stack

Fluxbase is built with a modern, production-ready stack:

### Frontend
- **Next.js 14+ (App Router)** – React-based full-stack framework  
- **TypeScript** – Strongly typed JavaScript for better reliability  
- **Tailwind CSS** – Utility-first styling for fast UI building  
- **shadcn/ui** – Accessible, prebuilt UI components  
- **Lucide Icons** – Clean, customizable icon set  

### Backend
- **Next.js API Routes** – Lightweight server-side logic  
- **Custom Storage Layer** – Manages data persistence and unique row IDs  
- **Middleware** – Auth/session handling and route protection  

### Tooling & Ops
- **PostCSS** – For Tailwind & CSS transformations  
- **ESLint + TypeScript** – Code quality and linting  
- **PM2** – Keeps production server alive  
- **NGINX/Caddy (Optional)** – For HTTPS & reverse proxy setups  

---

## 🚀 Getting Started

### Requirements

- **Node.js v18+**
- **npm** or **yarn**
- A dedicated server or computer where you control file storage

### Installation

```bash
git clone https://github.com/yourusername/fluxbase.git
cd fluxbase
npm install
```

### Local Development

```bash
npm run dev
```

Open your browser and go to **http://localhost:3000**.

### Production Server

```bash
npm run build
npm start
```

Keep it running in the background:

```bash
npm install -g pm2
pm2 start npm --name "fluxbase" -- run start
```

(Optional) Configure NGINX or Caddy to serve Fluxbase under HTTPS.

### Environment Variables

Create `.env.local` in the root folder:

```bash
PORT=3000
# Add other env vars here
```

---

## 🌍 Deployment Options

- 🖥 Dedicated servers (Linux, macOS, Windows)  
- ☁ Cloud services (Render, DigitalOcean, Railway, AWS EC2)  
- 📦 Containers (Docker support can be added for one-command deploys)  

---

## 👥 Contributing

Got ideas or fixes? Open an issue or create a pull request — contributions are welcome!

---

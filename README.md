# 🚌 Vahan Live | Real-Time Public Transport Tracking

![Vahan Live Banner](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=250&section=header&text=Vahan%20Live&fontSize=80&animation=fadeIn&fontAlignY=35&desc=The%20Next%20Gen%20Public%20Transport%20Monitoring%20System&descAlignY=55&descSize=20)

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vahan-live.vercel.app/)
[![Hackathon](https://img.shields.io/badge/🏆_Built_For-Hackathon-orange?style=for-the-badge)](https://luma.com/9sbv8bie?tk=38r4Cv)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**Eliminating "Blind Waiting" for daily commuters with real-time WebSocket precision.**

</div>

---

## 📖 About The Project

**Vahan Live** is a full-stack real-time tracking application designed to bridge the gap between public transport operators and commuters. By replacing static timetables with live visual data, we ensure passengers never have to guess where their bus is again.

> 🚀 **Hackathon Project:** This project was conceptually designed and built for the **Hackathon Event** hosted at [Luma](https://luma.com/9sbv8bie?tk=38r4Cv).

### 🌟 Why Vahan Live?
* **Zero Hardware Cost:** Uses driver smartphones as GPS beacons.
* **Real-Time Sync:** Sub-second latency updates using **Socket.io**.
* **Scalable:** Built to handle thousands of concurrent connections.
* **Dual-Role System:** Seamless interface switching between *Passenger* and *Driver* modes.

---

## ⚡ Live Demo

Check out the deployed application here:  
👉 **[https://vahan-live.vercel.app/](https://vahan-live.vercel.app/)**

*(Note: If no live buses are visible, the simulation bot is likely offline to save resources. You can run the simulator locally to test!)*

---

## 🎨 Key Features

| Feature | Description |
| :--- | :--- |
| **📍 Live Map Tracking** | Smooth animation of vehicles moving on the map without page refreshes. |
| **🔄 Socket.io Updates** | Instant bi-directional communication between server, drivers, and passengers. |
| **🤖 Simulation Bot** | A built-in Node.js bot that simulates bus traffic for testing and demos. |
| **👥 Dual User Modes** | **Driver Mode** to broadcast location & **Passenger Mode** to view active routes. |
| **📱 Responsive UI** | Glassmorphism design optimized for Mobile and Desktop users. |
| **🔋 Sustainability** | Reduces waiting time and carbon footprint by optimizing commute efficiency. |

---

## 🛠️ Tech Stack

<div align="center">

| **Category** | **Technologies** |
| :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer-black?style=flat&logo=framer&logoColor=blue) |
| **Backend** | ![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white) ![ExpressJS](https://img.shields.io/badge/Express.js-404D59?style=flat) ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&badgeColor=010101) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white) |
| **Deployment** | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) (Client) & ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white) (Server) |

</div>

---

## 📸 Screenshots


| Landing Page | Live Map |
|:---:|:---:|
| <img src="./assets/landing-page.png" alt="Landing Page" width="100%"> | <img src="./assets/map.png" alt="Map View" width="100%"> |
| *Beautiful Animated Intro* | *Real-time Vehicle Movement* |

---

## ⚙️ Getting Started

Follow these steps to run Vahan Live locally on your machine.

### Prerequisites
* Node.js (v14 or higher)
* npm or yarn
* MongoDB Atlas Connection String

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/vahan-live.git](https://github.com/your-username/vahan-live.git)
cd vahan-live
```

### 2. Backend Setup
Navigate to the server folder and install dependencies:
```bash
cd server
npm install
```
Create a .env file in the server root (DO NOT COMMIT THIS FILE):
```MONGO_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Frontend Setup
Open a new terminal, navigate to the client folder:

```
cd client
npm install
```
Start the React App:
```
npm run dev
```

Visit ```http://localhost:5173``` in your browser! 🚀


## 🧠 System Architecture
<img src="./assets/arch.png" alt="Architecture" width="100%">




## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project

2. Create your Feature Branch (```git checkout -b feature/AmazingFeature```)

3. Commit your Changes (```git commit -m 'Add some AmazingFeature'```)

4. Push to the Branch (```git push origin feature/AmazingFeature```)

5. Open a Pull Request


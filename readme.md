<div align="center">
  <h1>🌍 Null Stay</h1>
  <p>Your ultimate destination for finding incredible homes, flats, and spaces to stay.</p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/EJS-A91E50?style=for-the-badge&logo=ejs&logoColor=white" />
</div>

<br />

## 🚀 Overview

**Null Stay** is a full-stack web application inspired by leading property listing platforms. Built with a robust **Node.js / Express** backend and powered by **MongoDB**, it is designed to provide seamless property discovery workflows.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 
- **Database:** MongoDB (with Mongoose ODM)
- **View Engine:** EJS (Embedded JavaScript)
- **Configuration:** DotEnv

---

## ✨ Features (v1.0.0)

- **Dynamic Data Modeling:** Structured and scalable Mongoose schemas designed for dynamic property details (titles, descriptions, location, and adaptive pricing).
- **Automated Database Seeding:** Integrated initialization script (`initDB.js`) allowing for rapid, one-click provisioning of the stylized database with pristine demo sample listings.
- **Resilient Image Handling:** Built-in schema fallback logic for gracefully rendering properties with missing or blank image uploads.
- **RESTful API Foundations:** Clean architecture currently serving dynamic database records into customized, absolute-pathed EJS Views.

---

## 💻 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and a local instance of [MongoDB](https://www.mongodb.com/docs/manual/installation/) running on your machine.

### 1. Install Dependencies
```bash
npm install 
```

### 2. Configure Environment
Create a `.env` file in the root directory setup with your local MongoDB string and preferred Port:

```env
DB_URL="mongodb://127.0.0.1:27017/null-stay"
CONN_PORT=8080
```

### 3. Initialize the Database
Want a head start? Seed your database with a collection of high-quality sample properties instantly by running:

```bash
node data/initDB.js
```
*(This gracefully clears old collections and creates fresh ones)*

### 4. Run the Application
Finally, fire up the development server!

```bash
nodemon index.js
```

---
<div align="center">
  Built with ❤️ by <b>Vedant Hande</b>
</div>

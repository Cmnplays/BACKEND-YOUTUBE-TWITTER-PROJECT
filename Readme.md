# 📺 Social Video App API Documentation

This API provides endpoints for handling user registrations, video uploads, tweets, comments, likes, and subscriptions. It is designed to allow interactions with videos, tweets, and other user-generated content in a social media-style app.

## Base URL

`http://localhost:3000/api/v1/`

---

## 🧑‍💼 User Routes

### 🔹 Register a User

- **POST** `/users/register`
- **Body:** `form-data`
  - `username` (string, required)
  - `email` (string, required)
  - `fullName` (string, required)
  - `password` (string, required)
  - `avatar` (file, required)
  - `coverImage` (file, optional)

### 🔹 Login

- **POST** `/users/login`
- **Body:** `JSON`
  - `email` (string, required)
  - `password` (string, required)

### 🔹 Logout

- **POST** `/users/logout`

### 🔹 Refresh Access Token

- **POST** `/users/refresh-token`

### 🔹 Change Password

- **POST** `/users/change-password`
- **Body:** `urlencoded`
  - `oldPass` (string, required)
  - `newPass` (string, required)
  - `confirmPass` (string, required)

### 🔹 Get Current User

- **POST** `/users/current-user`

### 🔹 Update Account Details

- **PATCH** `/users/update-account`
- **Body:** `JSON`
  - `fullName` (string, optional)
  - `email` (string, optional)
  - `username` (string, optional)

### 🔹 Update Cover Image

- **PATCH** `/users/cover-image`
- **Body:** `form-data`
  - `coverImage` (file, required)

### 🔹 Update Avatar

- **PATCH** `/users/update-avatar`
- **Body:** `form-data`
  - `avatar` (file, required)

### 🔹 Get User Channel

- **GET** `/users/channel/:username`

### 🔹 Get Watch History

- **GET** `/users/history`

---

## 🎬 Video Routes

### 🔹 Upload Video

- **POST** `/video`
- **Body:** `form-data`
  - `title` (string, required)
  - `description` (string, required)
  - `thumbnail` (file, required)
  - `videoFile` (file, required)

### 🔹 Get All Videos

- **GET** `/video`
- **Query Parameters:**
  - `query` (string, optional)
  - `sortBy` (string, optional)
  - `sortType` (string, optional)
  - `userId` (string, optional)

### 🔹 Get Video by ID

- **GET** `/video/:videoId`

### 🔹 Update Video Details

- **PATCH** `/video/:videoId`
- **Body:** `form-data`
  - `title` (string, optional)
  - `description` (string, optional)
  - `thumbnail` (file, optional)

### 🔹 Delete Video

- **DELETE** `/video/:videoId`

### 🔹 Toggle Publish Status

- **PATCH** `/video/toggle/publish/:videoId`

---

## ❤️ Like Routes

### 🔹 Toggle Video Like

- **POST** `/likes/toggle/v/:videoId`

### 🔹 Toggle Tweet Like

- **POST** `/likes/toggle/t/:tweetId`

### 🔹 Toggle Comment Like

- **POST** `/likes/toggle/c/:commentId`

### 🔹 Get Liked Videos

- **GET** `/likes/videos`
- **Query Parameters:**
  - `limit` (number, optional)
  - `page` (number, optional)

### 🔹 Get Liked Tweets

- **GET** `/likes/tweets`
- **Query Parameters:**
  - `limit` (number, optional)
  - `page` (number, optional)

---

## 💬 Comment Routes

### 🔹 Add Comment to Video

- **POST** `/comments/:videoId`
- **Body:** `urlencoded`
  - `content` (string, required)

### 🔹 Delete Comment

- **DELETE** `/comments/c/:commentId`

### 🔹 Update Comment

- **PATCH** `/comments/c/:commentId`
- **Body:** `urlencoded`
  - `newContent` (string, required)

### 🔹 Get Video Comments

- **GET** `/comments/:videoId`

### 🔹 Add Tweet Comment

- **POST** `/comments/t/:tweetId`
- **Body:** `urlencoded`
  - `content` (string, required)

### 🔹 Get Tweet Comments

- **GET** `/comments/t/:tweetId`

### 🔹 Delete Tweet Comment

- **DELETE** `/comments/t/:commentId`

### 🔹 Update Tweet Comment

- **PATCH** `/comments/t/:commentId`
- **Body:** `urlencoded`
  - `newContent` (string, required)

---

## 🐦 Tweet Routes

### 🔹 Add Tweet

- **POST** `/tweets/`
- **Body:** `urlencoded`
  - `content` (string, required)

### 🔹 Get User Tweets

- **POST** `/tweets/user/:userId`

### 🔹 Update Tweet

- **PATCH** `/tweets/:tweetId`
- **Body:** `urlencoded`
  - `newContent` (string, required)

### 🔹 Delete Tweet

- **DELETE** `/tweets/:tweetId`

### 🔹 Get All Tweets

- **GET** `/tweets`
- **Query Parameters:**
  - `limit` (number, optional)
  - `page` (number, optional)

---

## 📥 Subscription Routes

### 🔹 Toggle Subscription

- **POST** `/subscription/c/:channelId`

### 🔹 Get Channel Subscribers

- **GET** `/subscription/c/:channelId`

### 🔹 Get Subscribed Channels

- **GET** `/subscription/u/:userId`

---

## 🎞️ Playlist Routes

### 🔹 Create Playlist

- **POST** `/playlist/`
- **Body:** `urlencoded`
  - `name` (string, required)
  - `description` (string, required)

### 🔹 Get User Playlists

- **GET** `/playlist/user/:userId`
- **Query Parameters:**
  - `limit` (number, optional)
  - `page` (number, optional)

### 🔹 Add Video to Playlist

- **PATCH** `/playlist/add/:videoId/:playlistId`

### 🔹 Remove Video from Playlist

- **PATCH** `/playlist/remove/:videoId/:playlistId`

### 🔹 Delete Playlist

- **DELETE** `/playlist/:playlistId`

### 🔹 Get Playlist Videos

- **GET** `/playlist/:playlistId`
- **Query Parameters:**
  - `limit` (number, optional)
  - `page` (number, optional)

---

## 📊 Dashboard Routes

### 🔹 Get Channel Videos

- **POST** `/dashboard/videos/:channelId`
- **Query Parameters:**
  - `limit` (number, optional)

### 🔹 Get Channel Stats

- **GET** `/dashboard/stats`

---

## 👁 Views

### 🔹 Increment Video Views

- **GET** `/views/v/:videoId`

### 🔹 Increment Tweet Views

- **GET** `/views/t/:tweetId`

---

## 🛠 Built With

- **Express.js** for server-side logic
- **Mongoose** for MongoDB interactions
- **Multer** for file uploads
- **Cloudinary** for media storage
- **JWT** for authentication

---

> **Note:** Use `form-data` for file uploads and `urlencoded` or `JSON` for other data types when testing via Postman or frontend.

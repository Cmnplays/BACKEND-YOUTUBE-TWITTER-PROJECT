# 📺 Social Video App API Documentation

Base URL: `http://localhost:3000/api/v1/`

---

## 🧑‍💼 User Routes

### 🔹 Register a User

* **POST** `/users/register`
* **Body:** `form-data`

  * `username`, `email`, `fullName`, `password`, `avatar`, `coverImage`

### 🔹 Login

* **POST** `/users/login`
* **Body:** `JSON`

  * `email`, `password`

### 🔹 Logout

* **POST** `/users/logout`

### 🔹 Refresh Access Token

* **POST** `/users/refresh-token`

### 🔹 Change Password

* **POST** `/users/change-password`
* **Body:** `urlencoded`

  * `oldPass`, `newPass`, `confirmPass`

### 🔹 Get Current User

* **POST** `/users/current-user`

### 🔹 Update Account Details

* **PATCH** `/users/update-account`
* **Body:** `JSON`

  * `fullName`, `email`, `username`

### 🔹 Update Cover Image

* **PATCH** `/users/cover-image`
* **Body:** `form-data`

  * `coverImage`

### 🔹 Update Avatar

* **PATCH** `/users/update-avatar`
* **Body:** `form-data`

  * `avatar`

### 🔹 Get User Channel

* **GET** `/users/channel/:username`

### 🔹 Get Watch History

* **GET** `/users/history`

---

## 🎬 Video Routes

### 🔹 Upload Video

* **POST** `/video`
* **Body:** `form-data`

  * `title`, `description`, `thumbnail`, `videoFile`

### 🔹 Get All Videos

* **GET** `/video`
* **Query:** `query`, `sortBy`, `sortType`, `userid`

### 🔹 Get Video by ID

* **GET** `/video/:videoId`

### 🔹 Update Video Details

* **PATCH** `/video/:videoId`
* **Body:** `form-data`

  * `title`, `description`, `thumbnail`

### 🔹 Delete Video

* **DELETE** `/video/:videoId`

### 🔹 Toggle Publish Status

* **PATCH** `/video/toggle/publish/:videoId`

---

## ❤️ Like Routes

### 🔹 Toggle Video Like

* **POST** `/likes/toggle/v/:videoId`

### 🔹 Toggle Tweet Like

* **POST** `/likes/toggle/t/:tweetId`

### 🔹 Toggle Comment Like

* **POST** `/likes/toggle/c/:commentId`

### 🔹 Get Liked Videos

* **GET** `/likes/videos?limit=3&page=1`

### 🔹 Get Liked Tweets

* **GET** `/likes/tweets?limit=2&page=1`

---

## 💬 Comment Routes

### 🔹 Add Comment to Video

* **POST** `/comments/:videoId`
* **Body:** `urlencoded` → `content`

### 🔹 Delete Comment

* **DELETE** `/comments/c/:commentId`

### 🔹 Update Comment

* **PATCH** `/comments/c/:commentId`
* **Body:** `urlencoded` → `newContent`

### 🔹 Get Video Comments

* **GET** `/comments/:videoId`

### 🔹 Add Tweet Comment

* **POST** `/comments/t/:tweetId`
* **Body:** `urlencoded` → `content`

### 🔹 Get Tweet Comments

* **GET** `/comments/t/:tweetId`

### 🔹 Delete Tweet Comment

* **DELETE** `/comment/t/:tweetId`

### 🔹 Update Tweet Comment

* **PATCH** `/comments/t/:commentId`
* **Body:** `urlencoded` → `newContent`

---

## 🐦 Tweet Routes

### 🔹 Add Tweet

* **POST** `/tweets/`
* **Body:** `urlencoded` → `content`

### 🔹 Get User Tweets

* **POST** `/tweets/user/:userId`

### 🔹 Update Tweet

* **PATCH** `/tweets/:tweetId`
* **Body:** `urlencoded` → `newContent`

### 🔹 Delete Tweet

* **DELETE** `/tweets/:tweetId`

### 🔹 Get All Tweets

* **GET** `/tweets/?limit=5&page=1`

---

## 📥 Subscription Routes

### 🔹 Toggle Subscription

* **POST** `/subscription/c/:channelId`

### 🔹 Get Channel Subscribers

* **GET** `/subscription/c/:channelId`

### 🔹 Get Subscribed Channels

* **GET** `/subscription/u/:userId`

---

## 🎞️ Playlist Routes

### 🔹 Create Playlist

* **POST** `/playlist/`
* **Body:** `urlencoded` → `name`, `description`

### 🔹 Get User Playlists

* **GET** `/playlist/user/:userId?limit=3&page=1`

### 🔹 Add Video to Playlist

* **PATCH** `/playlist/add/:videoId/:playlistId`

### 🔹 Remove Video from Playlist

* **PATCH** `/playlist/remove/:videoId/:playlistId`

### 🔹 Delete Playlist

* **DELETE** `/playlist/:playlistId`

### 🔹 Get Playlist Videos

* **GET** `/playlist/:playlistId?limit=1&page=1`

---

## 📊 Dashboard Routes

### 🔹 Get Channel Videos

* **POST** `/dashboard/videos/:channelId`
* **Query/Body:** Optional `limit`

### 🔹 Get Channel Stats

* **GET** `/dashboard/stats`

---

## 👁 Views

### 🔹 Increment Video Views

* **GET** `/views/v/:videoId`

### 🔹 Increment Tweet Views

* **GET** `/views/t/:tweetId`

---

✅ All routes follow RESTful conventions.
🔒 Use authentication (JWT) where required.
🛠 Built with Express, Mongoose, Multer, and more.

> **Note:** File paths shown in Postman should be replaced by actual file uploads via form-data when testing via clients like Postman or frontend.

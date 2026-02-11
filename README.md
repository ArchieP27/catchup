# CatchUp 💬

CatchUp is a real-time, full-stack chat application built with **Spring Boot 4** and **WebSockets**. It features a modern pastel UI, secure user authentication, and instant message delivery.

![CatchUp Dashboard](screenshots/ui.png)

## ✨ Features

* **Real-Time Messaging:** Instant communication powered by STOMP over WebSockets.
* **Secure Authentication:** Custom Login and Registration system using Spring Security 7.
* **Robust Validation:** Real-time feedback for duplicate usernames and password security.
* **Pastel UI:** A clean, minimal aesthetic built with Bootstrap 5 and custom CSS.
* **Persistence:** Chat history and user accounts stored securely in H2/MySQL.

## 🛠️ Tech Stack

* **Backend:** Java 17, Spring Boot 4.0.2
* **Security:** Spring Security 7 (Lambda-based configuration)
* **Frontend:** Thymeleaf, Bootstrap 5, Vanilla JavaScript
* **Database:** H2 (In-memory) / MySQL
* **Protocol:** STOMP over WebSockets

## 🚀 Getting Started

### Prerequisites
* **JDK 17** or higher
* **Maven 3.6+**

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/ArchieP27/catchup.git](https://github.com/ArchieP27/catchup.git)
   cd catchup
   ```
2. **Build the project**

    ```bash
    mvn clean install
    ```
3. **Run the application**

    ```bash
    mvn spring-boot:run
    ```
4. **Access CatchUp**

    Open your browser and go to: `http://localhost:8080/login`

## 📁 Project Structure

* `src/main/java/.../config`: Security and WebSocket configurations.
* `src/main/java/.../model`: Entity definitions (User, Message).
* `src/main/resources/templates`: Thymeleaf views (Login, Register, Chat).
* `src/main/resources/static`: Custom CSS and UI assets.

## 🎨 Attributions

The visual experience of CatchUp is enhanced by beautiful icons from [Flaticon](https://www.flaticon.com/). Special thanks to the following authors:
* Flat Icon
* FreePik
* RukanIcon


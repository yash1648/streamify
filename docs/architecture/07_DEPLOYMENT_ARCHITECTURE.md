# Deployment Architecture

---

## Overview

The platform deploys on two free-tier services:

| Service | Platform | URL Pattern |
|---|---|---|
| Frontend (React) | Vercel | `https://yourapp.vercel.app` |
| Backend (Spring Boot) | Render | `https://yourapp.onrender.com` |

Total monthly cost: **$0**

---

## Frontend Deployment (Vercel)

### Build Settings

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Environment Variables (Vercel Dashboard)

```env
VITE_BACKEND_URL=https://yourapp.onrender.com
VITE_WS_URL=wss://yourapp.onrender.com/ws
```

### Deployment Trigger

Push to `main` branch → Vercel auto-deploys.

---

## Backend Deployment (Render)

### Service Settings

| Setting | Value |
|---|---|
| Runtime | Java (or Docker) |
| Build Command | `./mvnw clean package -DskipTests` |
| Start Command | `java -jar target/watchparty-*.jar` |
| Plan | Free |

### Environment Variables (Render Dashboard)

```env
PORT=8080
SPRING_PROFILES_ACTIVE=prod
ALLOWED_ORIGINS=https://yourapp.vercel.app
```

### Render Free Tier Behaviour

- Server **spins down after 15 minutes of inactivity**
- First request after spin-down takes ~30 seconds to wake
- Acceptable for development; upgrade to paid tier for production

---

## Production Topology

```
GitHub (main branch)
        |
        |─── Vercel CI/CD ──► React Build ──► CDN
        |                                        |
        |─── Render CI/CD ──► Spring Boot        |
                                   |             |
                            WebSocket /ws        |
                                   |             |
                            Browser ◄────────────┘
                               |
                         WebRTC (P2P)
                               |
                            Peer Browser
```

---

## CORS Configuration

The backend must allow the Vercel frontend origin:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns("https://*.vercel.app", "http://localhost:*")
            .allowedMethods("GET", "POST", "OPTIONS")
            .allowCredentials(true);
    }
}
```

---

## WebSocket Origin Allowlist

```java
registry.addEndpoint("/ws")
    .setAllowedOriginPatterns(
        "https://*.vercel.app",
        "http://localhost:*"
    )
    .withSockJS();
```

---

## Local Development

```
Frontend: http://localhost:5173   (Vite dev server)
Backend:  http://localhost:8080   (Spring Boot)
WebSocket: ws://localhost:8080/ws
```

See `development/01_SETUP_GUIDE.md` for full local setup instructions.

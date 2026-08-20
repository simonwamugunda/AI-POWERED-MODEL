# SortIQ mobile migration plan

## Findings from the current repository

The current frontend is a single-page browser application (`index.html`, `styles.css`, and `script.js`), not a React application. It provides a model-operations dashboard, image upload, browser camera capture, detection overlays, session-only prediction history, CSV export, theme preference, and static profile/model panels.

`app.py` is a Flask API. Its reusable `POST /predict` endpoint receives a multipart field named `file` and returns:

```json
{
  "detectedItems": [{ "label": "PET", "confidence": 0.94 }],
  "recommendedBin": "Blue bin",
  "boundingBoxes": [],
  "summary": "Detected 1 item(s) using custom YOLOv8 model."
}
```

No Firebase configuration, authentication code, database integration, or React components were found. The active Flask implementation loads `7M.pt`; `best0.pt` is mentioned in the specification but is not present in the project root.

## Migration map

| Existing web feature | Mobile equivalent | Reuse / rewrite |
| --- | --- | --- |
| `index.html` dashboard | `app/dashboard.jsx` | Rewrite for touch-first layout |
| Browser upload and `getUserMedia` in `script.js` | `app/scan.jsx` + Expo ImagePicker | Rewrite; same image workflow |
| `fetch('/predict')` | `services/api.js` | Reuse endpoint; adapt client request |
| Results panel / recommendation | `app/result.jsx` | Rewrite UI; preserve response data |
| Browser session history | `services/storage.js`, `app/history.jsx` | Upgrade to persistent local storage |
| Prediction table | `app/history.jsx` | Rewrite as mobile list |
| Model overview | `app/statistics.jsx` | Simplify for mobile |
| Flask + YOLOv8 inference | `app.py`, model weights | Keep unchanged for MVP |

## Files intentionally left unchanged

`app.py`, `7M.pt`, `index.html`, `script.js`, and `styles.css` remain the existing web product. The `mobile-app` directory is a separate Expo project.

## Firebase follow-up

Before adding Firebase SDK code, provide or create the Firebase project configuration and security rules. Then add Firebase Authentication, Firestore scan records with validated `organizationId`, Firebase Storage image paths, and protected routes. Never use Firebase Admin credentials in the mobile app.

## Run locally

1. From `mobile-app`, install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_BASE_URL`.
3. Ensure that URL is reachable from the phone. `http://localhost:5000` on a computer is not reachable from a physical phone without LAN tunnelling/address configuration.
4. Run `npx expo start` and test with Expo Go or a development build.

For production, deploy Flask behind HTTPS, set the production URL in EAS environment variables, and use EAS Build to produce an Android APK/AAB.

# Locator

Routes:

- `/locator/` public live-location view
- `/locator/admin/` private location-sharing controls

Before deploying:

1. Fill in `locator/shared/config.js`.
2. Replace `YOUR_FIREBASE_ADMIN_UID` in `locator/firebase-database.rules.json`.
3. Deploy the Firebase Realtime Database rules.
4. Enable Firebase Authentication for the admin account.

The public page only shows coordinates when sharing is active and `expiresAt` is still in the future.

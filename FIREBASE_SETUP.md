# Firebase blog setup

The blog uses Firebase Authentication and Cloud Firestore. Visitors can read published posts. Only the verified admin email in `firebase-config.js` can create, edit, publish, or delete posts; Firestore Rules enforce this access.

## Firebase project status

- Project: `muhammad-umar-portfolio-blog` (Spark plan).
- Authentication: Email/Password with passwordless email link enabled. The admin page only offers email-link sign-in, and Firebase creates the admin account the first time the verified email completes sign-in.
- Authorized domains: Firebase default domains, `localhost`, and `muhammad-umar-portfolio-phi.vercel.app`.
- Cloud Firestore: default database in `asia-south1` (Mumbai), created in production mode.
- Rules: published in the Firebase console; local source is `firestore.rules`.
- Composite index: `posts` on `published` ascending and `publishedAt` descending; created in the console and tracked in `firestore.indexes.json`.

The public blog page is `blog.html`; the admin editor is `blog-admin.html`. Readers can search and filter by tags. Admins can save drafts, publish and edit posts, add cover image URLs, format article text, and embed YouTube videos. YouTube embeds use the privacy-enhanced player.

Cover images use external HTTPS image URLs. Firebase Storage is not configured, so publishing images does not require enabling paid billing for a new storage bucket.

## Deploy

The repository includes a GitHub Pages workflow. The live Vercel hostname is already authorized for email-link sign-in. If deploying to a different hostname, add that hostname under Firebase Authentication > Settings > Authorized domains.

The web app settings in `firebase-config.js` are public client settings. Never add Firebase Admin SDK service account credentials to this static website.

// Firebase web app settings are public client configuration, not service credentials.
export const firebaseConfig = {
  apiKey: "AIzaSyCQ_-dwkj5av9Zv7VQYmdXxyPJjRLiy5GE",
  authDomain: "muhammad-umar-portfolio-blog.firebaseapp.com",
  projectId: "muhammad-umar-portfolio-blog",
  storageBucket: "muhammad-umar-portfolio-blog.firebasestorage.app",
  messagingSenderId: "146848181775",
  appId: "1:146848181775:web:6b2513ead5a4ef52d5bd7a"
};

export const adminEmail = "mohammadumarjawad64@gmail.com";

export function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean);
}

// Firebase setup — loaded straight from the CDN so the site stays plain HTML/CSS/JS
// (no build step, deploys as-is to GitHub Pages).
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// A Firebase web config is not a secret: access is controlled by firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyDxy0XKyTimhF3J-u6VT0GuqutXIPgcHJM",
  authDomain: "loykratong-a0499.firebaseapp.com",
  projectId: "loykratong-a0499",
  storageBucket: "loykratong-a0499.firebasestorage.app",
  messagingSenderId: "189803680075",
  appId: "1:189803680075:web:4616d037e3267c2f81d8ce",
  measurementId: "G-7LSJ198EV3",
};

const app = initializeApp(firebaseConfig);
isSupported().then((ok) => ok && getAnalytics(app)).catch(() => {});

const db = getFirestore(app);
const kratongs = collection(db, "kratongs");

/** Save one kratong. Resolves with its document id. */
export async function saveKratong({ name, wish, type, lucky }) {
  const ref = await addDoc(kratongs, {
    name,
    wish,
    type,
    lucky,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Listen to the most recent kratongs. `onChange(list, added)` gets the whole
 * list (newest first) and the ones that arrived since the last call.
 * Returns the unsubscribe function.
 */
export function watchRecentKratongs(max, onChange, onError) {
  const q = query(kratongs, orderBy("createdAt", "desc"), limit(max));
  let first = true;
  return onSnapshot(
    q,
    (snap) => {
      const toKratong = (d) => ({ id: d.id, ...d.data() });
      const list = snap.docs.map(toKratong);
      const added = first
        ? []
        : snap
            .docChanges()
            // Skip our own not-yet-confirmed writes: the page already floats those.
            .filter((c) => c.type === "added" && !c.doc.metadata.hasPendingWrites)
            .map((c) => toKratong(c.doc));
      first = false;
      onChange(list, added);
    },
    onError
  );
}

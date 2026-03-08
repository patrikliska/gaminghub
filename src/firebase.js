import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GAMES_COLLECTION = 'games';

export async function fetchGames() {
  const q = query(collection(db, GAMES_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addGame(game) {
  const docRef = await addDoc(collection(db, GAMES_COLLECTION), {
    ...game,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...game };
}

export async function updateGame(id, data) {
  await updateDoc(doc(db, GAMES_COLLECTION, id), data);
}

export async function deleteGame(id) {
  await deleteDoc(doc(db, GAMES_COLLECTION, id));
}

export { db };

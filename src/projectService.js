import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const PROJECTS_COLLECTION = 'projects';

function buildQuery(userId) {
  return query(
    collection(db, PROJECTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
}

/** Subscribe to real-time project updates. Returns an unsubscribe function. */
export function subscribeProjects(userId, callback) {
  const q = buildQuery(userId);
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
    }));
    callback(projects);
  });
}

/** Create a new project. Returns the doc reference. */
export async function createProject(userId, name) {
  return addDoc(collection(db, PROJECTS_COLLECTION), {
    userId,
    name,
    createdAt: serverTimestamp(),
  });
}

/** Rename a project. */
export async function renameProject(projectId, name) {
  return updateDoc(doc(db, PROJECTS_COLLECTION, projectId), { name });
}

/** Delete a project. */
export async function deleteProject(projectId) {
  return deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
}

/**
 * Migrate existing tasks that have no projectId to a given project.
 * This runs once for users who had tasks before the projects feature.
 */
export async function migrateOrphanTasks(userId, projectId) {
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  let count = 0;

  snapshot.docs.forEach((d) => {
    if (!d.data().projectId) {
      batch.update(d.ref, { projectId });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }
  return count;
}

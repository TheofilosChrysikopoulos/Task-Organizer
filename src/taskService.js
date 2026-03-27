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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const TASKS_COLLECTION = 'tasks';

function tasksRef(userId) {
  return collection(db, TASKS_COLLECTION);
}

function buildQuery(userId) {
  return query(
    tasksRef(userId),
    where('userId', '==', userId),
    orderBy('emergency', 'desc'),
    orderBy('createdAt', 'asc')
  );
}

/** Subscribe to real-time task updates. Returns an unsubscribe function. */
export function subscribeTasks(userId, callback) {
  const q = buildQuery(userId);
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      deadline: d.data().deadline?.toDate?.() ?? null,
    }));
    callback(tasks);
  });
}

/** Create a new task. */
export async function createTask(userId, { title, description, emergency, deadline }) {
  return addDoc(collection(db, TASKS_COLLECTION), {
    userId,
    title,
    description: description || '',
    emergency: emergency || 3,
    status: 'in-progress',
    sequelOf: null,
    history: [],
    createdAt: serverTimestamp(),
    deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
  });
}

/** Mark a task as completed. */
export async function completeTask(taskId) {
  return updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    status: 'completed',
  });
}

/**
 * Reopen a completed task with a sequel.
 * Appends old title to history, sets a new title.
 */
export async function reopenWithSequel(taskId, currentTitle, currentHistory, newTitle) {
  const updatedHistory = [...(currentHistory || []), currentTitle];
  return updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    status: 'in-progress',
    title: newTitle,
    history: updatedHistory,
  });
}

/** Update task fields (title, description, emergency, deadline). */
export async function updateTask(taskId, fields) {
  const data = { ...fields };
  if (data.deadline !== undefined) {
    data.deadline = data.deadline ? Timestamp.fromDate(new Date(data.deadline)) : null;
  }
  return updateDoc(doc(db, TASKS_COLLECTION, taskId), data);
}

/** Delete a task permanently. */
export async function deleteTask(taskId) {
  return deleteDoc(doc(db, TASKS_COLLECTION, taskId));
}

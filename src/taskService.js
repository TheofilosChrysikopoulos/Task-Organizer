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
    const tasks = snapshot.docs.map((d) => {
      const data = d.data();
      // Convert Timestamps in chain entries
      const chain = (data.chain || []).map((entry) => ({
        ...entry,
        createdAt: entry.createdAt?.toDate?.() ?? new Date(),
        deadline: entry.deadline?.toDate?.() ?? null,
      }));
      return {
        id: d.id,
        ...data,
        chain,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        deadline: data.deadline?.toDate?.() ?? null,
      };
    });
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
    chain: [],
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

/** Mark a completed task back as in-progress (undo done). */
export async function uncompleteTask(taskId) {
  return updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    status: 'in-progress',
  });
}

/**
 * Create a sequel task linked to a completed parent.
 * The new task gets its own description, deadline, and creation date.
 * The parent's info is appended to the chain for history display.
 */
export async function createSequel(userId, parentTask, { title, description, emergency, deadline }) {
  const parentEntry = {
    taskId: parentTask.id,
    title: parentTask.title,
    description: parentTask.description || '',
    createdAt: parentTask.createdAt instanceof Date
      ? Timestamp.fromDate(parentTask.createdAt)
      : parentTask.createdAt,
    deadline: parentTask.deadline instanceof Date
      ? Timestamp.fromDate(parentTask.deadline)
      : parentTask.deadline ?? null,
  };

  // Rebuild the chain: convert any Date objects in existing chain back to Timestamps for Firestore
  const existingChain = (parentTask.chain || []).map((entry) => ({
    ...entry,
    createdAt: entry.createdAt instanceof Date
      ? Timestamp.fromDate(entry.createdAt)
      : entry.createdAt,
    deadline: entry.deadline instanceof Date
      ? Timestamp.fromDate(entry.deadline)
      : entry.deadline ?? null,
  }));

  const newChain = [...existingChain, parentEntry];

  return addDoc(collection(db, TASKS_COLLECTION), {
    userId,
    title,
    description: description || '',
    emergency: emergency || parentTask.emergency,
    status: 'in-progress',
    sequelOf: parentTask.id,
    chain: newChain,
    createdAt: serverTimestamp(),
    deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
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

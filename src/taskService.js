import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const TASKS_COLLECTION = 'tasks';

/** Subscribe to real-time task updates for a project. Returns an unsubscribe function. */
export function subscribeTasks(userId, projectId, callback) {
  // Simple query: only equality filters, no orderBy → no composite index needed
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    where('projectId', '==', projectId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((d) => {
        const data = d.data();
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
      // Sort client-side: emergency desc, then createdAt asc
      tasks.sort((a, b) => b.emergency - a.emergency || a.createdAt - b.createdAt);
      callback(tasks);
    },
    (error) => {
      console.error('subscribeTasks error:', error);
      callback([]);
    }
  );
}

/** Create a new task. */
export async function createTask(userId, projectId, { title, description, emergency, deadline }) {
  return addDoc(collection(db, TASKS_COLLECTION), {
    userId,
    projectId,
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
    projectId: parentTask.projectId,
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

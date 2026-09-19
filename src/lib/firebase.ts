import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Member, TimeSlot } from '../types';
import { INITIAL_MEMBERS } from '../data/mockMembers';

// Initialize Firebase App
export const firebaseApp = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

// Initialize Firestore with designated database ID
export const db: Firestore = getFirestore(
  firebaseApp,
  firebaseConfig.firestoreDatabaseId || undefined
);

/**
 * Validate Firestore server connectivity per Firebase Skill guidelines
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline status:', error.message);
    }
    return false;
  }
}

export const CURRENT_SEED_VERSION = 5;

/**
 * Seed or re-seed initial members into Firestore when seed version changes
 */
export async function seedMembersIfEmpty(): Promise<void> {
  try {
    const metaRef = doc(db, 'system', 'meta');
    const metaSnap = await getDoc(metaRef);
    const data = metaSnap.data();

    if (data?.seedVersion === CURRENT_SEED_VERSION) {
      return;
    }

    console.log('Syncing team dataset (Version 5) to Firestore...');
    const colRef = collection(db, 'members');
    const snapshot = await getDocs(colRef);

    // Delete legacy members if schema or dataset updated
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }

    // Write updated team members (Pamela Medina as Admin, etc.)
    for (const member of INITIAL_MEMBERS) {
      await setDoc(doc(db, 'members', member.id), member);
    }

    await setDoc(metaRef, {
      hasSeeded: true,
      seedVersion: CURRENT_SEED_VERSION,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error seeding members to Firestore:', error);
  }
}

/**
 * Subscribe to real-time changes in team members
 */
export function subscribeToMembers(
  onUpdate: (members: Member[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'members');

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      // Check if Firestore dataset requires seed update (v5)
      try {
        const metaRef = doc(db, 'system', 'meta');
        const metaSnap = await getDoc(metaRef);
        if (!metaSnap.exists() || metaSnap.data()?.seedVersion !== CURRENT_SEED_VERSION) {
          await seedMembersIfEmpty();
          onUpdate(INITIAL_MEMBERS);
          return;
        }
      } catch (e) {
        console.warn('Meta check warning:', e);
      }

      if (snapshot.empty) {
        onUpdate([]);
        return;
      }

      const remoteMembers: Member[] = [];
      snapshot.forEach((docSnap) => {
        remoteMembers.push(docSnap.data() as Member);
      });

      // Sort consistently by firstName
      remoteMembers.sort((a, b) => a.firstName.localeCompare(b.firstName));
      onUpdate(remoteMembers);
    },
    (err) => {
      console.error('Error on members snapshot listener:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save or update a member in Firestore (persisted in cloud for all teammates)
 */
export async function saveMemberToFirestore(member: Member): Promise<void> {
  try {
    const memberDocRef = doc(db, 'members', member.id);
    await setDoc(memberDocRef, member, { merge: true });
    // Mark system as seeded so empty state is never forced
    const metaRef = doc(db, 'system', 'meta');
    await setDoc(metaRef, { hasSeeded: true }, { merge: true });
  } catch (error) {
    console.error('Error saving member to Firestore:', error);
    throw error;
  }
}

/**
 * Update busy slots of a member in Firestore
 */
export async function updateMemberBusySlotsInFirestore(
  memberId: string,
  busySlots: TimeSlot[]
): Promise<void> {
  try {
    const memberDocRef = doc(db, 'members', memberId);
    await setDoc(memberDocRef, { busySlots }, { merge: true });
  } catch (error) {
    console.error('Error updating busy slots in Firestore:', error);
    throw error;
  }
}

/**
 * Delete a member from Firestore
 */
export async function deleteMemberFromFirestore(memberId: string): Promise<void> {
  try {
    const memberDocRef = doc(db, 'members', memberId);
    await deleteDoc(memberDocRef);
    // Ensure system is marked as seeded so deleting this member doesn't cause a reseed
    const metaRef = doc(db, 'system', 'meta');
    await setDoc(metaRef, { hasSeeded: true }, { merge: true });
  } catch (error) {
    console.error('Error deleting member from Firestore:', error);
    throw error;
  }
}

/**
 * Delete multiple/sample members in batch
 */
export async function deleteMultipleMembersFromFirestore(memberIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const id of memberIds) {
      batch.delete(doc(db, 'members', id));
    }
    const metaRef = doc(db, 'system', 'meta');
    batch.set(metaRef, { hasSeeded: true }, { merge: true });
    await batch.commit();
  } catch (error) {
    console.error('Error deleting multiple members from Firestore:', error);
    throw error;
  }
}

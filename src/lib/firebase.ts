import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
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

/**
 * Seed initial members into Firestore if the collection is empty
 */
export async function seedMembersIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, 'members');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log('Seeding initial members to Firestore...');
      for (const member of INITIAL_MEMBERS) {
        await setDoc(doc(db, 'members', member.id), member);
      }
    }
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
      if (snapshot.empty) {
        // If empty on first read, seed and return initial
        await seedMembersIfEmpty();
        onUpdate(INITIAL_MEMBERS);
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
  } catch (error) {
    console.error('Error deleting member from Firestore:', error);
    throw error;
  }
}

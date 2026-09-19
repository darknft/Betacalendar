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

/**
 * Seed initial members into Firestore if the collection is empty AND never seeded before
 */
export async function seedMembersIfEmpty(): Promise<void> {
  try {
    const metaRef = doc(db, 'system', 'meta');
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists() && metaSnap.data()?.hasSeeded) {
      // User or system has already processed the initial seed. If empty, it means all members were deliberately deleted.
      return;
    }

    const colRef = collection(db, 'members');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log('Seeding initial members to Firestore...');
      for (const member of INITIAL_MEMBERS) {
        await setDoc(doc(db, 'members', member.id), member);
      }
      await setDoc(metaRef, { hasSeeded: true, seededAt: new Date().toISOString() });
    } else {
      await setDoc(metaRef, { hasSeeded: true });
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
        // Check if database has already been seeded before
        const metaRef = doc(db, 'system', 'meta');
        try {
          const metaSnap = await getDoc(metaRef);
          if (metaSnap.exists() && metaSnap.data()?.hasSeeded) {
            // Deliberately empty, do not re-seed!
            onUpdate([]);
            return;
          }
        } catch {
          // If offline or permission check
        }

        await seedMembersIfEmpty();
        onUpdate(INITIAL_MEMBERS);
        return;
      }

      const remoteMembers: Member[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Member;
        const isExampleOrForbidden = 
          data.firstName?.toLowerCase().includes('karla') ||
          data.firstName?.toLowerCase().includes('carlos') || 
          data.firstName?.toLowerCase().includes('claudia') ||
          data.firstName?.toLowerCase().includes('denisse');

        if (isExampleOrForbidden) {
          // Clean up example or forbidden members from Firestore
          deleteDoc(docSnap.ref).catch(() => {});
        } else {
          remoteMembers.push(data);
        }
      });

      // If Sofia was removed or if remoteMembers is missing Pamela or has fewer than 5 members, ensure Pamela and all 5 members exist
      if (remoteMembers.length === 0) {
        await seedMembersIfEmpty();
        onUpdate(INITIAL_MEMBERS);
        return;
      }

      // Check if Pamela Medina is in remote members; ensure she is admin
      const pamelaIndex = remoteMembers.findIndex(m => m.email === 'bpamelamedina@gmail.com' || (m.firstName === 'Pamela' && m.lastName === 'Medina'));
      if (pamelaIndex !== -1 && remoteMembers[pamelaIndex].role !== 'admin') {
        remoteMembers[pamelaIndex].role = 'admin';
        setDoc(doc(db, 'members', remoteMembers[pamelaIndex].id), { role: 'admin' }, { merge: true }).catch(() => {});
      }

      // If remoteMembers has fewer than 5 members, supplement with remaining initial members
      if (remoteMembers.length < 5) {
        for (const initM of INITIAL_MEMBERS) {
          if (!remoteMembers.some(rm => rm.id === initM.id || rm.email === initM.email)) {
            remoteMembers.push(initM);
            setDoc(doc(db, 'members', initM.id), initM).catch(() => {});
          }
        }
      }

      // Sort consistently by firstName (Pamela first if admin, or alphabetically)
      remoteMembers.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return a.firstName.localeCompare(b.firstName);
      });
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

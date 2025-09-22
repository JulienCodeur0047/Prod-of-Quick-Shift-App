// Fix: Firebase v9 modular imports are replaced with v8 namespaced imports.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
// Fix: Import Employee type
import { User, Shift, Subscription, Payment, Plan, Employee, AbsenceType, InboxMessage } from '../types';

// --- CONTROL FLAG ---
// Set this to false to enable Firebase functionality.
const IS_FIREBASE_DISABLED = true;

// --- FIREBASE CONFIGURATION ---
// For enhanced security, Firebase configuration is loaded from environment variables.
// Create a `.env` file in the root of your project and add the following:
// REACT_APP_API_KEY=your_api_key
// REACT_APP_AUTH_DOMAIN=your_auth_domain
// REACT_APP_PROJECT_ID=your_project_id
// REACT_APP_STORAGE_BUCKET=your_storage_bucket
// REACT_APP_MESSAGING_SENDER_ID=your_messaging_sender_id
// REACT_APP_APP_ID=your_app_id
// REACT_APP_MEASUREMENT_ID=your_measurement_id
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};


// --- INITIALIZATION ---
let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;

if (!IS_FIREBASE_DISABLED) {
  app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  auth = app.auth();
  db = app.firestore();
}


// --- DATA CONVERSION HELPERS ---
// Recursively converts Firestore Timestamps to JS Date objects
const firestoreTimestampToDate = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(firestoreTimestampToDate);
    }
    if (typeof data === 'object') {
        for (const key in data) {
            // Fix: Use v8 Timestamp from the firebase namespace.
            if (data[key] instanceof firebase.firestore.Timestamp) {
                data[key] = data[key].toDate();
            } else if (typeof data[key] === 'object') {
                firestoreTimestampToDate(data[key]);
            }
        }
    }
    return data;
};

// Converts a Firestore doc snapshot to a usable object with ID
const docWithId = (doc: any) => {
    const data = doc.data();
    return firestoreTimestampToDate({ ...data, id: doc.id });
};


// --- AUTHENTICATION API ---
export type LoginResult = {
    success: boolean;
    reason?: 'invalid' | 'unverified';
}

export const apiLogin = async (email: string, pass: string): Promise<LoginResult> => {
    if (IS_FIREBASE_DISABLED) return { success: false, reason: 'invalid' };
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, pass);
        if (userCredential.user && !userCredential.user.emailVerified) {
            await auth.signOut(); // Prevent unverified user from being logged in
            return { success: false, reason: 'unverified' };
        }
        return { success: true };
    } catch (error: any) {
        console.error("Firebase login error:", error);
        return { success: false, reason: 'invalid' };
    }
};

export const apiLoginWithGoogle = async (): Promise<{ success: boolean }> => {
    if (IS_FIREBASE_DISABLED) return { success: false };
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const firebaseUser = result.user;
        const isNewUser = result.additionalUserInfo?.isNewUser;

        if (isNewUser && firebaseUser) {
            // If it's a new user, create their company, user profile, and subscription
            await db.runTransaction(async (transaction) => {
                const companyRef = db.collection('companies').doc();
                const companyName = `${firebaseUser.displayName}'s Company`;
                transaction.set(companyRef, {
                    name: companyName,
                    ownerId: firebaseUser.uid
                });

                const userRef = db.collection('users').doc(firebaseUser.uid);
                const newUser: Omit<User, 'id'> = {
                    name: firebaseUser.displayName || 'New User',
                    email: firebaseUser.email!,
                    plan: 'Gratuit',
                    avatarUrl: firebaseUser.photoURL,
                    businessType: 'Company',
                    companyName: companyName,
                    isVerified: true, // Google accounts are always verified
                    companyId: companyRef.id,
                };
                transaction.set(userRef, newUser);

                const subscriptionRef = db.collection('subscriptions').doc();
                const now = new Date();
                const nextPaymentDate = new Date();
                nextPaymentDate.setDate(now.getDate() + 14); // 14-day trial
                const newSubscription: Omit<Subscription, 'id'> = {
                    userId: firebaseUser.uid,
                    companyId: companyRef.id,
                    plan: 'Gratuit',
                    status: 'active',
                    startDate: now,
                    nextPaymentDate: nextPaymentDate,
                    renewalDate: nextPaymentDate
                };
                transaction.set(subscriptionRef, newSubscription);
            });
        }
        return { success: true };
    } catch (error) {
        console.error("Google Sign-In error:", error);
        return { success: false };
    }
};

export const apiRegister = async (userData: Omit<User, 'id' | 'avatarUrl' | 'isVerified' | 'companyId' | 'password'>, pass: string, price: number): Promise<{ success: boolean }> => {
    if (IS_FIREBASE_DISABLED) return { success: false };
    try {
        // Fix: Use v8 authentication syntax.
        const userCredential = await auth.createUserWithEmailAndPassword(userData.email, pass);
        const firebaseUser = userCredential.user!;

        // Fix: Use v8 transaction syntax.
        await db.runTransaction(async (transaction) => {
            // 1. Create a new company
            // Fix: Use v8 firestore syntax.
            const companyRef = db.collection('companies').doc();
            transaction.set(companyRef, {
                name: userData.companyName,
                ownerId: firebaseUser.uid
            });

            // 2. Create the user profile document
            // Fix: Use v8 firestore syntax.
            const userRef = db.collection('users').doc(firebaseUser.uid);
            const newUser: Omit<User, 'id'> = {
                ...userData,
                avatarUrl: null,
                isVerified: firebaseUser.emailVerified,
                companyId: companyRef.id,
            };
            transaction.set(userRef, newUser);
            
            // 3. Create subscription document
            const subscriptionRef = db.collection('subscriptions').doc();
            const now = new Date();
            let nextPaymentDate = new Date();
            if (userData.plan === 'Gratuit') {
                // 14-day trial for free plan
                nextPaymentDate.setDate(now.getDate() + 14);
            } else {
                // 1 month for paid plans
                nextPaymentDate.setMonth(now.getMonth() + 1);
            }
            const newSubscription: Omit<Subscription, 'id'> = {
                userId: firebaseUser.uid,
                companyId: companyRef.id,
                plan: userData.plan,
                status: 'active',
                startDate: now,
                nextPaymentDate: nextPaymentDate,
                renewalDate: nextPaymentDate
            };
            transaction.set(subscriptionRef, newSubscription);

            // 4. Create initial payment record for paid plans
            if (userData.plan !== 'Gratuit') {
                const paymentRef = db.collection('payments').doc();
                const newPayment: Omit<Payment, 'id'> = {
                    userId: firebaseUser.uid,
                    subscriptionId: subscriptionRef.id,
                    date: now,
                    amount: price,
                    plan: userData.plan,
                    status: 'Paid'
                };
                transaction.set(paymentRef, newPayment);
            }
        });

        // Update Firebase Auth profile name
        // Fix: Use v8 user profile update syntax.
        await firebaseUser.updateProfile({ displayName: userData.name });
        
        // Send verification email
        await firebaseUser.sendEmailVerification();
        
        return { success: true };
    } catch (error) {
        console.error("Firebase registration error:", error);
        return { success: false };
    }
};

// Fix: Use v8 sign out syntax.
export const apiLogout = () => {
    if (IS_FIREBASE_DISABLED) return;
    auth.signOut();
};

export const apiForgotPassword = async (email: string): Promise<{ success: boolean; messageKey: string }> => {
    if (IS_FIREBASE_DISABLED) {
        console.log(`Simulating password reset for ${email}`);
        return { success: true, messageKey: 'auth.resetLinkSentTitle' };
    }
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true, messageKey: 'auth.resetLinkSentTitle' };
    } catch (error) {
        console.error("Password reset error:", error);
        // Avoid leaking user existence. Always return success unless it's a server error.
        return { success: false, messageKey: 'auth.invalidCredentials' };
    }
};


// Fix: Use v8 auth state change syntax.
export const onAuthStateChangedListener = (callback: (user: any) => void) => {
    if (IS_FIREBASE_DISABLED) {
        // Immediately signals that no user is logged in, allowing the app to render the public view.
        callback(null);
        return () => {}; // Return a no-op unsubscribe function
    }
    return auth.onAuthStateChanged(callback);
};

export const getUserData = async (userId: string): Promise<{ user: User, subscription: Subscription | null, paymentHistory: Payment[] } | null> => {
    if (IS_FIREBASE_DISABLED) return null;
    // Fix: Use v8 firestore syntax.
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        return null;
    }

    const user = docWithId(userDoc);
    
    // In a real app, fetch subscription and payment history based on user.companyId or user.id
    // For now, returning empty/null data
    return {
        user,
        subscription: null, // TODO: Fetch subscription data
        paymentHistory: []    // TODO: Fetch payment history
    };
};

export const apiUpdateUser = async (userId: string, updatedData: Partial<User>): Promise<User> => {
    if (IS_FIREBASE_DISABLED) throw new Error("Firebase is disabled. Cannot update user.");
    // Fix: Use v8 firestore syntax.
    const userRef = db.collection('users').doc(userId);
    await userRef.update(updatedData);
    if (updatedData.name && auth.currentUser) {
        // Fix: Use v8 user profile update syntax.
        await auth.currentUser.updateProfile({ displayName: updatedData.name });
    }
    // Fix: Use v8 firestore syntax.
    const updatedDoc = await userRef.get();
    return docWithId(updatedDoc);
};

export const apiChangePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; messageKey: string }> => {
    if (IS_FIREBASE_DISABLED) return { success: false, messageKey: 'auth.notLoggedIn' };
    const user = auth.currentUser;
    if (!user || !user.email) return { success: false, messageKey: 'auth.notLoggedIn' };

    try {
        // Fix: Use v8 reauthentication and password update syntax.
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
        return { success: true, messageKey: 'profile.passwordChangedSuccess' };
    } catch (error) {
        console.error("Password change error:", error);
        return { success: false, messageKey: 'profile.incorrectPasswordError' };
    }
};

// --- MOBILE APP API ---
export const apiLoginEmployee = async (email: string, accessCode: string): Promise<Employee | null> => {
    if (IS_FIREBASE_DISABLED) {
        // Mock a successful login for preview purposes
        if (email && accessCode) {
            console.log(`Mock login for ${email}`);
            return {
                id: 'mobile-user-1',
                name: 'Jane Doe',
                email: email,
                role: 'Cashier',
                avatarUrl: null,
                phone: '555-123-4567',
                gender: 'Female',
                companyId: 'mock-company-1',
                accessCode: accessCode,
            };
        }
        return null;
    }
    try {
        const query = db.collection('employees')
            .where('email', '==', email)
            .where('accessCode', '==', accessCode)
            .limit(1);

        const snapshot = await query.get();
        if (snapshot.empty) {
            console.log('No matching employee found.');
            return null;
        }
        return docWithId(snapshot.docs[0]);
    } catch (error) {
        console.error("Employee login error:", error);
        return null;
    }
};

export const apiGetMobileData = async (employeeId: string, companyId: string): Promise<{ shifts: Shift[], absenceTypes: AbsenceType[] }> => {
    if (IS_FIREBASE_DISABLED) {
        // Provide mock data for the mobile preview
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 8);
        
        const mockShifts: Shift[] = [
            {
                id: 'shift-today',
                employeeId: employeeId,
                startTime: new Date(new Date().setHours(9, 0, 0, 0)),
                endTime: new Date(new Date().setHours(17, 0, 0, 0)),
                locationId: 'Main Store',
                departmentId: 'Electronics',
                companyId: companyId,
            },
            {
                id: 'shift-tomorrow',
                employeeId: employeeId,
                startTime: new Date(new Date(tomorrow).setHours(14, 0, 0, 0)),
                endTime: new Date(new Date(tomorrow).setHours(22, 0, 0, 0)),
                locationId: 'Warehouse',
                departmentId: 'Logistics',
                companyId: companyId,
            },
             {
                id: 'shift-next-week',
                employeeId: employeeId,
                startTime: new Date(new Date(nextWeek).setHours(10, 0, 0, 0)),
                endTime: new Date(new Date(nextWeek).setHours(18, 0, 0, 0)),
                locationId: 'Main Store',
                departmentId: 'Cashier',
                companyId: companyId,
            }
        ];

        const mockAbsenceTypes: AbsenceType[] = [
            { id: 'at-1', name: 'Sick Leave', color: '#f44336', companyId: companyId },
            { id: 'at-2', name: 'Vacation', color: '#2196f3', companyId: companyId },
            { id: 'at-3', name: 'Personal', color: '#ff9800', companyId: companyId },
        ];

        return { shifts: mockShifts, absenceTypes: mockAbsenceTypes };
    }
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const twoWeeksFromNow = new Date(today);
        twoWeeksFromNow.setDate(today.getDate() + 14);

        const shiftsQuery = db.collection('shifts')
            .where('companyId', '==', companyId)
            .where('employeeId', '==', employeeId)
            .where('startTime', '>=', today)
            .where('startTime', '<=', twoWeeksFromNow);

        const absenceTypesQuery = db.collection('absenceTypes')
            .where('companyId', '==', companyId);

        const [shiftsSnapshot, absenceTypesSnapshot] = await Promise.all([
            shiftsQuery.get(),
            absenceTypesQuery.get(),
        ]);
        
        const shifts = shiftsSnapshot.docs.map(docWithId);
        const absenceTypes = absenceTypesSnapshot.docs.map(docWithId);

        return { shifts, absenceTypes };
    } catch (error) {
        console.error("Error fetching mobile data:", error);
        return { shifts: [], absenceTypes: [] };
    }
};

export const apiSubmitRequest = async (requestData: Omit<InboxMessage, 'id' | 'status' | 'date'>): Promise<InboxMessage> => {
     if (IS_FIREBASE_DISABLED) {
        // Simulate a successful request submission for preview
        console.log("Simulating request submission:", requestData);
        return {
            ...requestData,
            id: `msg-${Date.now()}`,
            date: new Date(),
            status: 'pending',
        } as InboxMessage;
    }
    const fullRequestData = {
        ...requestData,
        date: new Date(),
        status: 'pending' as const
    };
    return apiCreateItem<InboxMessage>('inboxMessages', fullRequestData);
};


// --- DATA API ---

const collectionNames = [
    'employees', 'shifts', 'roles', 'locations', 'departments',
    'absences', 'absenceTypes', 'specialDays', 'specialDayTypes',
    'inboxMessages', 'employeeAvailabilities'
];

export const getCompanyData = async (companyId: string): Promise<any> => {
    if (IS_FIREBASE_DISABLED) {
        // Return an empty data structure to prevent app crashes.
        const emptyData: any = {};
        collectionNames.forEach(name => { emptyData[name] = []; });
        return emptyData;
    }
    const dataPromises = collectionNames.map(async (collName) => {
        // Fix: Use v8 firestore syntax for querying collections.
        const collRef = db.collection(collName);
        const q = collRef.where("companyId", "==", companyId);
        const snapshot = await q.get();
        return { [collName]: snapshot.docs.map(docWithId) };
    });
    
    const allDataArrays = await Promise.all(dataPromises);
    return Object.assign({}, ...allDataArrays);
};

export const apiCreateItem = async <T extends {id: string}>(collectionName: string, data: Omit<T, 'id'>): Promise<T> => {
    if (IS_FIREBASE_DISABLED) throw new Error("Firebase is disabled. Cannot create item.");
    // Fix: Use v8 firestore syntax for adding documents.
    const collRef = db.collection(collectionName);
    const docRef = await collRef.add(data);
    const newDoc = await docRef.get();
    return docWithId(newDoc);
};

export const apiUpdateItem = <T extends { id: string }>(collectionName: string, id: string, data: T) => {
    if (IS_FIREBASE_DISABLED) return Promise.reject(new Error("Firebase is disabled. Cannot update item."));
    // Fix: Use v8 firestore syntax for updating documents.
    const docRef = db.collection(collectionName).doc(id);
    // Create a new object for the update, excluding the 'id' field to ensure a clean update payload.
    const { id: docId, ...dataToUpdate } = data;
    return docRef.update(dataToUpdate);
};

export const apiDeleteItem = (collectionName: string, itemId: string) => {
    if (IS_FIREBASE_DISABLED) return Promise.reject(new Error("Firebase is disabled. Cannot delete item."));
    // Fix: Use v8 firestore syntax for deleting documents.
    const docRef = db.collection(collectionName).doc(itemId);
    return docRef.delete();
};

// --- BULK OPERATIONS ---
export const apiUpdateAllShifts = (shifts: Shift[], companyId: string) => {
    if (IS_FIREBASE_DISABLED) return Promise.reject(new Error("Firebase is disabled. Cannot update shifts."));
    // Fix: Use v8 firestore batch syntax.
    const batch = db.batch();
    shifts.forEach(shift => {
        const shiftWithCompanyId = { ...shift, companyId };
        const docRef = db.collection('shifts').doc(shift.id);
        batch.set(docRef, shiftWithCompanyId);
    });
    return batch.commit();
};

export const apiBulkDeleteShifts = (shiftIds: string[]) => {
    if (IS_FIREBASE_DISABLED) return Promise.reject(new Error("Firebase is disabled. Cannot delete shifts."));
    // Fix: Use v8 firestore batch syntax.
    const batch = db.batch();
    shiftIds.forEach(id => {
        const docRef = db.collection('shifts').doc(id);
        batch.delete(docRef);
    });
    return batch.commit();
};

// Fix: Correctly type the employees parameter and the return value for bulk employee creation.
export const apiBulkCreateEmployees = async (employees: Omit<Employee, 'id' | 'companyId'>[], companyId: string): Promise<Employee[]> => {
    if (IS_FIREBASE_DISABLED) throw new Error("Firebase is disabled. Cannot create employees.");
    // Fix: Use v8 firestore batch syntax.
    const batch = db.batch();
    const newEmployeeDocs: any[] = [];
    const employeesCollection = db.collection('employees');
    employees.forEach(empData => {
        const docRef = employeesCollection.doc();
        const newEmployee = { ...empData, companyId, id: docRef.id };
        batch.set(docRef, { ...empData, companyId });
        newEmployeeDocs.push(newEmployee);
    });
    await batch.commit();
    return newEmployeeDocs;
};
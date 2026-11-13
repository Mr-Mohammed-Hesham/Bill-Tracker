import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getFirestore,
  collection,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  DEFAULT_HOUSEHOLD_SETTINGS,
  type ExpenseCategory,
  type ExpenseEntry,
  type ExpenseEntryType,
  type ExpenseStatus,
  type HouseholdSettings,
  type IncomeEntry,
  type SavingEntry,
  type SavingKind,
} from '../types/finance';

export const ALLOWED_EMAILS = [
  'mr.mohamed.hesham93@gmail.com',
  'mohammedhesham872@gmail.com',
] as const;

export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return (ALLOWED_EMAILS as readonly string[]).includes(normalized);
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        getAnalytics(app);
      }
    })
    .catch(() => {});

  // Validate connection to Firestore on initial boot
  getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

function sanitizeString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function sanitizeAmount(value: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error('يرجى إدخال مبلغ صحيح أكبر من صفر');
  }
  return Math.min(Math.round(num * 100) / 100, 100000000);
}

function sanitizeDate(date: string): { date: string; month: string } {
  const cleaned = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    throw new Error('صيغة التاريخ غير صحيحة');
  }
  return { date: cleaned, month: cleaned.slice(0, 7) };
}

function requireAuthorizedUser(): { uid: string; email: string } {
  const user = auth.currentUser;
  if (!user || !isAllowedEmail(user.email)) {
    throw new Error('غير مصرح لهذا الحساب بإجراء تعديلات');
  }
  return {
    uid: user.uid,
    email: normalizeEmail(user.email),
  };
}

export interface HouseholdDataSnapshot {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  savings: SavingEntry[];
  settings: HouseholdSettings;
}

export function subscribeToHouseholdData(
  onData: (partial: Partial<HouseholdDataSnapshot>) => void,
  onError: (err: Error) => void
): () => void {
  const unsubscribers: Array<() => void> = [];
  const allowedList = [...ALLOWED_EMAILS];

  const incomesQuery = query(
    collection(db, 'incomes'),
    where('createdByEmail', 'in', allowedList)
  );
  unsubscribers.push(
    onSnapshot(
      incomesQuery,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as IncomeEntry)
          .sort((a, b) => b.date.localeCompare(a.date));
        onData({ incomes: items });
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'incomes');
        } catch (e) {
          onError(e as Error);
        }
      }
    )
  );

  const expensesQuery = query(
    collection(db, 'expenses'),
    where('createdByEmail', 'in', allowedList)
  );
  unsubscribers.push(
    onSnapshot(
      expensesQuery,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as ExpenseEntry)
          .sort((a, b) => b.date.localeCompare(a.date));
        onData({ expenses: items });
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'expenses');
        } catch (e) {
          onError(e as Error);
        }
      }
    )
  );

  const savingsQuery = query(
    collection(db, 'savings'),
    where('createdByEmail', 'in', allowedList)
  );
  unsubscribers.push(
    onSnapshot(
      savingsQuery,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as SavingEntry)
          .sort((a, b) => b.date.localeCompare(a.date));
        onData({ savings: items });
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'savings');
        } catch (e) {
          onError(e as Error);
        }
      }
    )
  );

  const settingsRef = doc(db, 'householdSettings', 'default');
  unsubscribers.push(
    onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          onData({
            settings: {
              ...DEFAULT_HOUSEHOLD_SETTINGS,
              ...(snap.data() as HouseholdSettings),
            },
          });
        } else {
          onData({ settings: DEFAULT_HOUSEHOLD_SETTINGS });
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, 'householdSettings/default');
        } catch (e) {
          onError(e as Error);
        }
      }
    )
  );

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
  };
}

/* ================= INCOMES CRUD ================= */

export interface IncomeInput {
  title: string;
  source: string;
  amount: number;
  date: string;
  notes: string;
}

export async function createIncome(input: IncomeInput): Promise<void> {
  const { uid, email } = requireAuthorizedUser();
  const title = sanitizeString(input.title, 120);
  const source = sanitizeString(input.source, 80);
  if (!title || !source) throw new Error('يرجى إدخال عنوان ومصدر الدخل');
  const amount = sanitizeAmount(input.amount);
  const { date, month } = sanitizeDate(input.date);
  const notes = sanitizeString(input.notes || '', 400);
  const id = makeDocId('inc');

  try {
    await setDoc(doc(db, 'incomes', id), {
      title,
      source,
      amount,
      date,
      month,
      notes,
      createdByUid: uid,
      createdByEmail: email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `incomes/${id}`);
  }
}

export async function updateIncome(id: string, input: IncomeInput): Promise<void> {
  requireAuthorizedUser();
  const title = sanitizeString(input.title, 120);
  const source = sanitizeString(input.source, 80);
  if (!title || !source) throw new Error('يرجى إدخال عنوان ومصدر الدخل');
  const amount = sanitizeAmount(input.amount);
  const { date, month } = sanitizeDate(input.date);
  const notes = sanitizeString(input.notes || '', 400);

  try {
    await updateDoc(doc(db, 'incomes', id), {
      title,
      source,
      amount,
      date,
      month,
      notes,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `incomes/${id}`);
  }
}

export async function deleteIncome(id: string): Promise<void> {
  requireAuthorizedUser();
  try {
    await deleteDoc(doc(db, 'incomes', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `incomes/${id}`);
  }
}

/* ================= EXPENSES & BILLS CRUD ================= */

export interface ExpenseInput {
  title: string;
  category: ExpenseCategory;
  entryType: ExpenseEntryType;
  status: ExpenseStatus;
  amount: number;
  date: string;
  notes: string;
}

export async function createExpense(input: ExpenseInput): Promise<void> {
  const { uid, email } = requireAuthorizedUser();
  const title = sanitizeString(input.title, 120);
  if (!title) throw new Error('يرجى إدخال وصف المصروف أو الفاتورة');
  const amount = sanitizeAmount(input.amount);
  const { date, month } = sanitizeDate(input.date);
  const notes = sanitizeString(input.notes || '', 400);
  const id = makeDocId('exp');

  try {
    await setDoc(doc(db, 'expenses', id), {
      title,
      category: input.category,
      entryType: input.entryType,
      status: input.status,
      amount,
      date,
      month,
      notes,
      createdByUid: uid,
      createdByEmail: email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `expenses/${id}`);
  }
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  requireAuthorizedUser();
  const title = sanitizeString(input.title, 120);
  if (!title) throw new Error('يرجى إدخال وصف المصروف أو الفاتورة');
  const amount = sanitizeAmount(input.amount);
  const { date, month } = sanitizeDate(input.date);
  const notes = sanitizeString(input.notes || '', 400);

  try {
    await updateDoc(doc(db, 'expenses', id), {
      title,
      category: input.category,
      entryType: input.entryType,
      status: input.status,
      amount,
      date,
      month,
      notes,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `expenses/${id}`);
  }
}

export async function toggleExpenseStatus(id: string, currentStatus: ExpenseStatus): Promise<void> {
  requireAuthorizedUser();
  const nextStatus: ExpenseStatus = currentStatus === 'paid' ? 'pending' : 'paid';
  try {
    await updateDoc(doc(db, 'expenses', id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `expenses/${id}`);
  }
}

export async function deleteExpense(id: string): Promise<void> {
  requireAuthorizedUser();
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
  }
}

/* ================= SAVINGS CRUD ================= */

export interface SavingInput {
  title: string;
  goalName: string;
  kind: SavingKind;
  amount: number;
  date: string;
  notes: string;
}

export async function createSaving(input: SavingInput): Promise<void> {
  const { uid, email } = requireAuthorizedUser();
  const title = sanitizeString(input.title, 120);
  const goalName = sanitizeString(input.goalName, 80);
  if (!title || !goalName) throw new Error('يرجى إدخال عنوان وهدف التوفير');
  const amount = sanitizeAmount(input.amount);
  const { date, month } = sanitizeDate(input.date);
  const notes = sanitizeString(input.notes || '', 400);
  const id = makeDocId('sav');

  try {
    await setDoc(doc(db, 'savings', id), {
      title,
      goalName,
      kind: input.kind,
      amount,
      date,
      month,
      notes,
      createdByUid: uid,
      createdByEmail: email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `savings/${id}`);
  }
}

export async function updateSaving(id: string, input: SavingInput): Promise<void> {
  requireAuthorizedUser();
  const title = sanitizeString(input.title, 120);
  const goalName = sanitizeString(input.goalName, 80);
  if (!title || !goalName) throw new Error('يرجى إدخال عنوان وهدف التوفير');
  const amount = sanitizeAmount(input.amount);
  const { date, month } = sanitizeDate(input.date);
  const notes = sanitizeString(input.notes || '', 400);

  try {
    await updateDoc(doc(db, 'savings', id), {
      title,
      goalName,
      kind: input.kind,
      amount,
      date,
      month,
      notes,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `savings/${id}`);
  }
}

export async function deleteSaving(id: string): Promise<void> {
  requireAuthorizedUser();
  try {
    await deleteDoc(doc(db, 'savings', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `savings/${id}`);
  }
}

/* ================= HOUSEHOLD SETTINGS ================= */

export async function saveHouseholdSettings(settings: HouseholdSettings): Promise<void> {
  const { uid } = requireAuthorizedUser();
  const householdName = sanitizeString(settings.householdName || 'ميزانية المنزل', 80);
  const currency = sanitizeString(settings.currency || 'ج.م', 12);
  const monthlyBudgetLimit = Math.max(0, Math.min(Number(settings.monthlyBudgetLimit) || 0, 100000000));
  const monthlySavingsTarget = Math.max(0, Math.min(Number(settings.monthlySavingsTarget) || 0, 100000000));

  try {
    await setDoc(doc(db, 'householdSettings', 'default'), {
      householdName,
      currency,
      monthlyBudgetLimit,
      monthlySavingsTarget,
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'householdSettings/default');
  }
}

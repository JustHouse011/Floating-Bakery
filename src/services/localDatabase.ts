// Version 3 adds product enquiries; existing cake and administration records are untouched.
export const LOCAL_DATABASE = "floating-bakery-quotations";
export function openLocalDatabase(
  factory: IDBFactory | undefined,
  name = LOCAL_DATABASE,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!factory) {
      reject(
        new Error(
          "Local browser storage is unavailable. Enable site storage and retry.",
        ),
      );
      return;
    }
    let settled = false;
    const request = factory.open(name, 4);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("quotations")) {
        db.createObjectStore("quotations", { keyPath: "id" }).createIndex(
          "reference",
          "reference",
          { unique: true },
        );
      }
      for (const name of ["workspace", "quotationAudit", "productEnquiries", "officialConfirmations"]) {
        if (!db.objectStoreNames.contains(name))
          db.createObjectStore(name, { keyPath: "id" });
      }
    };
    request.onblocked = () => {
      settled = true;
      reject(
        new Error(
          "Close other tabs using this demo, then retry the storage upgrade.",
        ),
      );
    };
    request.onerror = () => {
      settled = true;
      reject(
        new Error("Local storage could not be opened. No data was changed."),
      );
    };
    request.onsuccess = () => {
      const db = request.result;
      if (settled) {
        db.close();
        return;
      }
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}
export function localTransaction<T>(
  db: IDBDatabase,
  stores: string[],
  mode: IDBTransactionMode,
  run: (
    tx: IDBTransaction,
    finish: (value: T) => void,
    fail: (error: unknown) => void,
  ) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let result: T;
    let failure: unknown;
    const tx = db.transaction(stores, mode);
    const fail = (error: unknown) => {
      failure = error;
      tx.abort();
    };
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onabort = () => {
      db.close();
      reject(
        failure ??
          new Error(
            tx.error?.name === "QuotaExceededError"
              ? "Browser storage is full. Changes were not saved."
              : "Local changes could not be saved. Retry after enabling site storage.",
          ),
      );
    };
    tx.onerror = () => {};
    try {
      run(
        tx,
        (value) => {
          result = value;
        },
        fail,
      );
    } catch (error) {
      fail(error);
    }
  });
}

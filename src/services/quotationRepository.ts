import { openLocalDatabase } from "./localDatabase";
import type {
  QuotationRecord,
  QuotationRepository,
  QuotationListFilter,
  QuotationStatus,
} from "../types/quotation";
import { QUOTATION_STATUSES } from "../types/quotation";
import {
  canTransitionStatus,
  validateQuotationRecord,
} from "./quotationRecord";
import { validateReferenceContents } from "./referenceImages";
export class QuotationStorageError extends Error {
  constructor(
    public readonly code:
      | "unavailable"
      | "quota"
      | "duplicate"
      | "corrupt"
      | "blocked"
      | "not-found"
      | "transition",
    message: string,
  ) {
    super(message);
    this.name = "QuotationStorageError";
  }
}
export function quotationStorageError(error: unknown): QuotationStorageError {
  if (error instanceof QuotationStorageError) return error;
  const name = error instanceof Error ? error.name : "";
  if (name === "QuotaExceededError")
    return new QuotationStorageError(
      "quota",
      "Browser storage is full. Try smaller reference images or another browser. The request was not saved.",
    );
  if (name === "ConstraintError")
    return new QuotationStorageError(
      "duplicate",
      "A quotation with this identifier or reference already exists.",
    );
  return new QuotationStorageError(
    "unavailable",
    "Local browser storage is unavailable. Enable site storage or try another browser. The request has not been saved.",
  );
}
const DATABASE_NAME = "floating-bakery-quotations";
const STORE_NAME = "quotations";
export class IndexedDbQuotationRepository implements QuotationRepository {
  constructor(
    private readonly factory: () => IDBFactory | undefined = () =>
      globalThis.indexedDB,
    private readonly databaseName = DATABASE_NAME,
    private readonly now: () => Date = () => new Date(),
  ) {}
  private async open(): Promise<IDBDatabase> {
    try {
      return await openLocalDatabase(this.factory(), this.databaseName);
    } catch (error) {
      if (error instanceof Error && error.message.includes("other tabs"))
        throw new QuotationStorageError("blocked", error.message);
      throw quotationStorageError(error);
    }
  }
  private async validated(value: unknown): Promise<QuotationRecord> {
    try {
      const record = validateQuotationRecord(value);
      await Promise.all(
        record.references.map((image) =>
          validateReferenceContents(image, record.snapshot.requestPolicy),
        ),
      );
      return record;
    } catch {
      throw new QuotationStorageError(
        "corrupt",
        "This local quotation contains invalid stored data and cannot be opened.",
      );
    }
  }
  async create(value: QuotationRecord): Promise<QuotationRecord> {
    const record = await this.validated(value);
    const database = await this.open();
    return new Promise((resolve, reject) => {
      let transaction: IDBTransaction;
      let writeError: unknown;
      try {
        transaction = database.transaction(STORE_NAME, "readwrite");
        const request = transaction.objectStore(STORE_NAME).add(record);
        request.onerror = () => {
          writeError = request.error;
        };
      } catch (error) {
        database.close();
        reject(quotationStorageError(error));
        return;
      }
      transaction.oncomplete = () => {
        database.close();
        resolve(record);
      };
      transaction.onabort = () => {
        database.close();
        reject(quotationStorageError(writeError ?? transaction.error));
      };
      transaction.onerror = () => {};
    });
  }
  async getById(id: string): Promise<QuotationRecord | undefined> {
    const database = await this.open();
    const value = await new Promise<unknown>((resolve, reject) => {
      let result: unknown;
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        result = request.result;
      };
      transaction.oncomplete = () => {
        database.close();
        resolve(result);
      };
      transaction.onabort = () => {
        database.close();
        reject(quotationStorageError(transaction.error));
      };
      transaction.onerror = () => {};
    });
    return value === undefined ? undefined : this.validated(value);
  }
  async list(filter: QuotationListFilter = {}): Promise<QuotationRecord[]> {
    if (filter.status && !QUOTATION_STATUSES.includes(filter.status))
      throw new Error("Invalid quotation status filter");
    const database = await this.open();
    const values = await new Promise<unknown[]>((resolve, reject) => {
      let results: unknown[] = [];
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        results = request.result;
      };
      transaction.oncomplete = () => {
        database.close();
        resolve(results);
      };
      transaction.onabort = () => {
        database.close();
        reject(quotationStorageError(transaction.error));
      };
      transaction.onerror = () => {};
    });
    const records = await Promise.all(
      values.map((value) => this.validated(value)),
    );
    const query = (filter.search ?? "").trim().toLowerCase();
    return records
      .filter(
        (record) =>
          (!filter.status || record.status === filter.status) &&
          (!query ||
            `${record.reference} ${record.customer.fullName} ${record.customer.email}`
              .toLowerCase()
              .includes(query)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async updateStatus(
    id: string,
    status: QuotationStatus,
  ): Promise<QuotationRecord> {
    if (!QUOTATION_STATUSES.includes(status))
      throw new QuotationStorageError(
        "transition",
        "Choose a valid demonstration quotation status.",
      );
    const database = await this.open();
    return new Promise((resolve, reject) => {
      let result: QuotationRecord;
      let failure: unknown;
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);
      request.onsuccess = () => {
        try {
          if (request.result === undefined)
            throw new QuotationStorageError(
              "not-found",
              "This quotation could not be found on this browser.",
            );
          const existing = validateQuotationRecord(request.result);
          if (!canTransitionStatus(existing.status, status))
            throw new QuotationStorageError(
              "transition",
              `Cannot change ${existing.status} directly to ${status}.`,
            );
          if (existing.status === status) {
            result = existing;
            return;
          }
          const at = new Date(
            Math.max(this.now().getTime(), Date.parse(existing.updatedAt)),
          ).toISOString();
          result = validateQuotationRecord({
            ...existing,
            status,
            updatedAt: at,
            statusHistory: [
              ...existing.statusHistory,
              { from: existing.status, to: status, at },
            ],
          });
          objectStore.put(result);
        } catch (error) {
          failure = error;
          transaction.abort();
        }
      };
      transaction.oncomplete = () => {
        database.close();
        resolve(result);
      };
      transaction.onabort = () => {
        database.close();
        reject(
          failure instanceof QuotationStorageError
            ? failure
            : failure
              ? new QuotationStorageError(
                  "corrupt",
                  "The stored quotation cannot be updated because its data is invalid.",
                )
              : quotationStorageError(transaction.error),
        );
      };
      transaction.onerror = () => {};
    });
  }
}
export const quotationRepository = new IndexedDbQuotationRepository();

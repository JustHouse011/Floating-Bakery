import { createContext, useContext } from "react";
import type { QuotationRecord } from "../../types/quotation";
export const RecordsContext = createContext<{
  records: QuotationRecord[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}>({ records: [], loading: true, error: "", refresh: async () => {} });
export const useAdminRecords = () => useContext(RecordsContext);

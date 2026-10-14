export interface DemoEnquiry {
  id: string;
  name: string;
  email: string;
  telephone: string;
  type: string;
  message: string;
  createdAt: string;
  demo: true;
}
const storageKey = "floating:enquiries";
export function saveDemoEnquiry(
  data: Omit<DemoEnquiry, "id" | "createdAt" | "demo">,
): DemoEnquiry {
  const enquiry: DemoEnquiry = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    demo: true,
  };
  const existing: unknown = JSON.parse(
    localStorage.getItem(storageKey) || "[]",
  );
  if (!Array.isArray(existing)) throw new Error("Invalid enquiry storage");
  localStorage.setItem(storageKey, JSON.stringify([...existing, enquiry]));
  return enquiry;
}

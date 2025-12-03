// CSV Export Utility for Admin Dashboard

export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number | null | undefined);
}

export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Create headers
  const headers = columns.map((col) => col.header);

  // Create rows
  const rows = data.map((row) =>
    columns.map((col) => {
      let value: any;
      if (typeof col.accessor === "function") {
        value = col.accessor(row);
      } else {
        value = row[col.accessor];
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return "";
      }

      // Handle dates
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Handle strings with commas, quotes, or newlines
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    })
  );

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// User export columns
export const userExportColumns = [
  { header: "Name", accessor: "full_name" as const },
  { header: "Email", accessor: "email" as const },
  { header: "Phone", accessor: "phone" as const },
  { header: "Country", accessor: "country" as const },
  { header: "Currency", accessor: "currency" as const },
  { header: "Plan", accessor: "subscription_tier" as const },
  { header: "Status", accessor: "subscription_status" as const },
  { header: "Role", accessor: "role" as const },
  { 
    header: "Signup Date", 
    accessor: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : "" 
  },
];

// Transaction export columns
export const transactionExportColumns = [
  { header: "Reference", accessor: "reference" as const },
  { header: "User Email", accessor: "user_email" as const },
  { header: "Amount (NGN)", accessor: "amount_naira" as const },
  { header: "Plan", accessor: "plan" as const },
  { header: "Status", accessor: "status" as const },
  { header: "Payment Method", accessor: "payment_method" as const },
  { 
    header: "Date", 
    accessor: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : "" 
  },
];

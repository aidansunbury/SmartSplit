export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };

    reader.onerror = (e) => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}

export type Transaction = {
  timestamp: number;
  description: string;
  category: string;
  cost: number;
  currency: string;
  type: "payment" | "expense";
  // Maps the temporary person ID to the amount their balance should change (may be 0)
  amounts: Record<string, number>;
};

export type Person = {
  id: string;
  name: string;
};

export function parseFinancialCSV(csvContent: string) {
  // Ensure csvContent is a string and not undefined/null
  if (!csvContent || typeof csvContent !== "string") {
    throw new Error("Invalid CSV content");
  }

  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must contain at least headers and one data row");
  }

  const headers = lines[0].split(",");
  console.log(headers);
  // Extract people names from headers (skip first 5 columns)
  const people: Person[] = headers.slice(5).map((name) => ({
    id: crypto.randomUUID(),
    name: name?.trim() || "Unknown",
  }));
  console.log(people);

  // Skip empty lines and header
  const transactions: Transaction[] = lines
    .slice(2)
    .filter(
      (line) => line && typeof line === "string" && line.trim().length > 0,
    )
    .map((line) => {
      const columns = line.split(",");
      console.log(columns);

      // Ensure we have enough columns
      if (columns.length < 5 + people.length) {
        console.log("Skipping invalid line:", line);
        return null;
      }

      // Parse amounts for each person
      const amounts: Record<string, number> = {};
      people.forEach((person, index) => {
        amounts[person.id] = Number.parseFloat(columns[5 + index]) || 0;
      });

      // Check if it's a payment transaction
      const description = (columns[1] || "").trim();
      const nonZeroAmounts = Object.values(amounts).filter(
        (amount) => amount !== 0,
      );
      const isPayment =
        description.toLowerCase().includes("paid") &&
        nonZeroAmounts.length === 2;

      // Parse date taking timezone into account
      const date = new Date(columns[0] || "");
      const timestamp = !Number.isNaN(date.getTime())
        ? date.getTime() / 1000
        : 0;

      return {
        timestamp,
        description,
        category: columns[2] || "",
        cost: Number.parseFloat(columns[3]) || 0,
        currency: columns[4] || "USD",
        type: isPayment ? "payment" : "expense",
        amounts,
      };
    })
    .filter((transaction): transaction is Transaction => transaction !== null);

  return { people, transactions };
}

// Create or update Atlas Search / Vector indexes from JSON files.

/* Usage:
  tsx scripts/create-indexes.ts
  tsx scripts/create-indexes.ts --only=products,docs
  tsx scripts/create-indexes.ts --dry-run
  tsx scripts/create-indexes.ts --force-recreate
*/

// Env:
//   MONGODB_URI, MONGODB_DB

// Libs
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import * as path from "path";
import * as readline from "readline";

// Type Alias defining the expected shape of the index
type IndexSpec = {
    col: string;      // collection name
    name: string;     // index name in Atlas Search
    file: string;     // JSON file in config/indexes/
  };

// ALL_SPECS must be an array of objects that conform to the IndexSpec types
// List of indexes to loop over & create / update in Atlas
const ALL_SPECS: IndexSpec[] = [
    { col: "products", name: "vector", file: "products.vector.json" },
    { col: "products", name: "hybrid", file: "products.hybrid.json" },
    { col: "docs",     name: "vector", file: "docs.vector.json" },
    { col: "tickets",  name: "hybrid", file: "tickets.hybrid.json" },
];

// Function helper to load JSON index definition
const loadDefinition = (file: string): any => {
    // Dynamically builds the full, absolute path to an index JSON file
    const full = path.join(process.cwd(), "config", "indexes", file);
    return JSON.parse(readFileSync(full, "utf8"));
}
// Function to list existing indexes on a collection
const listExistingIndexes = async (db: any, colName: string): Promise<string[]> => {
    // Prefer the driver's helper if available; fallback to $listSearchIndexes
    const col = db.collection(colName);
    try {
      // Find existing search indexes
      const cursor = col.listSearchIndexes();

      // Fetch all results
      const all = await cursor.toArray();
      
      // Extract index names
      return all.map((idx: any) => idx.name);   
    } catch (err) {
      console.error(`Failed to list indexes for ${colName}:`, err);
      // If listing fails (older env), just assume none exist
      return [];
    }
  }

// simple prompt helper
const prompt = (question: string): Promise<string> => {
    // Create a readline interface for reading input from the user
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    // Return a promise that resolves to the user's input
    // Promise convers the callback-based rl.question() into something async/awaitable
    return new Promise((resolve) => {
      // Ask the question and wait for the user to respond
      rl.question(question, (answer) => {
        // Close the readline interface
        rl.close();
        // Resolve the promise with the user's input, while trimming any leading/trailing whitespace
        resolve(answer.trim());
      });
    });
}
  
const main = async () => {
    // Gather user input
    const uri = process.env.MONGODB_URI || await prompt("Enter your MongoDB URI: ");
    const dbName = process.env.MONGODB_DB || await prompt("Enter database name: ");
    const colName = await prompt("Enter collection name: ");
  
    // Create MongoDB client and connect
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
  
    const indexes = await listExistingIndexes(db, colName);
    console.log(`\nIndexes on '${colName}':`, indexes);
  
    await client.close();
  }
  
  main().catch(console.error);
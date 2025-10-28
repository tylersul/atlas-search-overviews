// embeddings/azure-openai-sdk.ts
import OpenAI from "openai";

export const getEmbeddingFromAzureSDK = async function (text: string): Promise<number[]> {
  const apiKey  = process.env.OPENAI_API_KEY!;
  const baseURL = process.env.OPENAI_BASE_URL!;        // .../openai/deployments/<deployment>
  const apiVer  = process.env.OPENAI_API_VERSION!;     // e.g., 2024-10-21
  const model   = process.env.OPENAI_EMBEDDING_MODEL!; // deployment name (non-empty)

  const client = new OpenAI({
    apiKey,
    baseURL,
    defaultQuery: { "api-version": apiVer },
    // Some Azure setups need this explicitly:
    // defaultHeaders: { "api-key": apiKey },
  });

  const res = await client.embeddings.create({ model, input: text });
  return res.data[0].embedding as number[];
}

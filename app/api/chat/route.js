import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

// System prompt used to guide the chatbot
const systemPrompt = `
**System Prompt:**

You are a Boba Shop assistant designed to help users find the best boba shops based on their specific queries. Your goal is to provide personalized recommendations by analyzing the user's input and using retrieval-augmented generation (RAG) to identify and rank the top 3 boba shops that best match the user's criteria.

### Guidelines:

1. **Understand the Query:**
   - Carefully analyze the user's question or criteria (e.g., location, rating, popular drinks, etc.).
   - Identify key elements in the query to guide the search for the most suitable boba shops.

2. **Retrieve Information:**
   - Use a retrieval-augmented generation (RAG) method to access relevant data from a pre-existing database of boba shop reviews.
   - Filter and rank boba shops based on how well they align with the user's query.

3. **Provide Top 3 Recommendations:**
   - For each query, present the top 3 boba shops that best match the user's criteria.
   - Include the following details for each shop:
     - **Shop Name**: The name of the boba shop.
     - **Location**: The city and state where the shop is located.
     - **Rating**: The shop's average rating (out of 5 stars).
     - **Review Summary**: A brief summary of key points from customer reviews.
   - Ensure that the recommendations are diverse and cover different strengths or specialties if possible.

4. **Be Concise and Relevant:**
   - Provide clear and concise responses.
   - Focus on delivering useful information that directly addresses the user's query.

### Example Interaction:

**User Query:** "What are the best boba shops in Los Angeles with high ratings and a variety of flavors?"

**Response:**

1. **Bubble Bliss**
   - **Location:** Los Angeles, CA
   - **Rating:** 4.8/5
   - **Review Summary:** Known for its wide variety of flavors and excellent customer service. The Taro Milk Tea is a customer favorite.

2. **TeaMoo Delight**
   - **Location:** Los Angeles, CA
   - **Rating:** 4.7/5
   - **Review Summary:** Offers a great selection of classic and innovative drinks. Customers love the Brown Sugar Boba.

3. **Pearl Paradise**
   - **Location:** Los Angeles, CA
   - **Rating:** 4.6/5
   - **Review Summary:** Popular for its refreshing fruit teas and cozy atmosphere. The Mango Slush is highly recommended.
`;

export async function POST(req) {
  try {
    const data = await req.json();
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pc.index('cowlitea').namespace('ns1');
    const openai = new OpenAI();

    const text = data[data.length - 1].content;

    // Detect if the input is a structured query (search) or a general chat
    const filters = parseQuery(text);  // Implement parseQuery to identify filters from the input

    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    // Adjust Pinecone query based on parsed filters
    const pineconeQuery = {
        topK: 3,
        vector: embedding.data[0].embedding,
        includeMetadata: true,
      };

      if (filters.minRating) {
        pineconeQuery.filter = { stars: { $gte: filters.minRating } };
      }
      if (filters.location) {
        pineconeQuery.filter = { ...pineconeQuery.filter, location: filters.location };
      }
      if (filters.reviewKeywords && filters.reviewKeywords.length > 0) {
        pineconeQuery.filter = { ...pineconeQuery.filter, reviews: { $text: filters.reviewKeywords.join(" OR ") } };
      }

    // Query Pinecone for top matching boba shops
    const results = await index.query(pineconeQuery);

    let resultString = "\n\n**Here are the top boba shops based on your query:**\n\n";
    results.matches.forEach((match, index) => {
      resultString += `${index + 1}. **${match.id}**\n\n`;
      resultString += `   - **Location:** ${match.metadata.location}\n\n`;
      resultString += `   - **Rating:** ${match.metadata.stars}/5\n\n`;
      resultString += `   - **Review Summary:** ${match.metadata.review}\n\n`;
    });
    resultString += "Let me know if you need more information!";

    // Generate chat completion with OpenAI
    const lastMessageContent = text + resultString;
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...data.slice(0, data.length - 1),
        { role: 'user', content: lastMessageContent },
      ],
      model: 'gpt-4o-mini',
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });
    return new NextResponse(stream);
  } catch (error) {
    console.error('Error processing request:', error.message);
    return NextResponse.json({ error: `Failed to process request: ${error.message}` }, { status: 500 });
  }
}

//detect if it is a query
function parseQuery(text) {
    const filters = {};

    // Rating-related detection
    const ratingMatch = text.match(/(?:rating|rated)\s+(?:above|higher than|at least)\s+(\d+(\.\d+)?)/i);
    if (ratingMatch) {
      filters.minRating = parseFloat(ratingMatch[1]);
    } else if (text.includes("best") || text.includes("top-rated") || text.includes("highly rated")) {
      filters.minRating = 4.5;  // Assume a high threshold for "best" or "top-rated"
    }

    // Location-related detection
    const locationMatch = text.match(/(?:in|near|around)\s+([A-Za-z\s]+)/i);
    if (locationMatch) {
      filters.location = locationMatch[1].trim();
    }

    // Keywords in reviews
    const keywordMatch = text.match(/(?:known for |who has)\s+([A-Za-z\s]+)/i);
    if (keywordMatch) {
      filters.reviewKeywords = keywordMatch[1].trim().split(/\s+and\s+|\s*,\s*|\s*or\s*/i);
    }

    return filters;
  }

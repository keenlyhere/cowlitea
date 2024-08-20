import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const openai = new OpenAI();
const index = pc.index('cowlitea').namespace('ns1');

async function scrapeProfessorData(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const firstName = $('div[class^="NameTitle__Name"] span:nth-child(1)').text().trim();
    const lastName = $('span[class^="NameTitle__LastNameWrapper"]').text().trim();
    const professorName = `${firstName} ${lastName}`;
    const subject = $('div[class^="NameTitle__Title"] span > a > b').first().text().trim();
    const rating = $('div[class^="RatingValue__Numerator"]').text().trim();
    const reviews = [];

    $('ul#ratingsList li div[class^="Comments__StyledComments"]').each((i, el) => {
      reviews.push($(el).text().trim());
    });

    console.log('professorName:', professorName);
    console.log('subject:', subject);
    console.log('rating:', rating);
    console.log('reviews:', reviews);

    return { professorName, subject, rating, reviews };
  } catch (error) {
    console.error('Error scraping data:', error);
    throw new Error('Failed to scrape professor data.');
  }
}

// Function to create embedding and insert into Pinecone
async function insertIntoPinecone(data) {
  try {
    const text = `${data.professorName} teaches ${data.subject}. Rating: ${data.rating}/5. ${data.reviews.join(' ')}`;
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    await index.upsert([
      {
        id: data.professorName,
        values: embedding.data[0].embedding,
        metadata: {
          subject: data.subject,
          stars: data.rating,
          reviews: data.reviews.join(' '),
        },
      },
    ]);
    console.log('Data inserted into Pinecone successfully.');
  } catch (error) {
    console.error('Error inserting data into Pinecone:', error);
    throw new Error(`Failed to insert data into Pinecone: ${error.message}`);
  }
}

// POST route to scrape and upsert to pinecone
export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error("No URL provided");
    }

    if (!url.includes('ratemyprofessors.com')) {
        throw new Error('The provided URL is not a valid Rate My Professors link.');
      }


    const professorData = await scrapeProfessorData(url);

    // validate scraped data
    if (!professorData.professorName || !professorData.subject || !professorData.rating || !professorData.reviews.length) {
      throw new Error("Scraped data is incomplete or invalid");
    }

    await insertIntoPinecone(professorData);

    return NextResponse.json({ message: 'Professor data added successfully.' });
  } catch (error) {
    console.error('Error processing request:', error.message);
    return NextResponse.json({ error: `Failed to process request: ${error.message}` }, { status: 500 });
  }
}

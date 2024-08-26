import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import * as cheerio from "cheerio";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const openai = new OpenAI();
const index = pc.index("cowlitea").namespace("ns1");

async function scrapeBobaShopData(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);


    const shopName = $("h1").first().text().trim();
    console.log("Shop Name:", shopName);


    const streetAddress = $("#location-and-hours address span")
      .first()
      .text()
      .trim();
    console.log("Street Address:", streetAddress);


    const cityStateZip = $("#location-and-hours address span")
      .last()
      .text()
      .trim();
    console.log("City, State, Zip:", cityStateZip);

    // address
    const addressRegex =
      /^(?<city>[A-Za-z\s]+),?\s*(?<state>[A-Z]{2})\s*(?<postalCode>\d{5}(?:-\d{4})?)$/;
    const match = cityStateZip.match(addressRegex);
    let location = {};

    if (match && match.groups) {
      location = {
        address: streetAddress,
        city: match.groups.city.trim(),
        state: match.groups.state.trim(),
        country: "USA",
        postalCode: match.groups.postalCode.trim(),
      };
      console.log("Parsed Location:", location);
    } else {
      console.error("Failed to parse the city, state, and postal code.");
    }

    // Rating
    const rating = $('div[class^="photo-header-content"] span')
      .contents()
      .filter(function () {
        return this.nodeType === 3;
      })
      .first()
      .text()
      .trim();

    console.log("Rating Text:", rating);


    const hours = {
      monday: $(
        "#location-and-hours table tbody tr:nth-child(2) td:nth-child(2) ul li p"
      )
        .text()
        .trim(),
      tuesday: $(
        "#location-and-hours table tbody tr:nth-child(4) td:nth-child(2) ul li p"
      )
        .text()
        .trim(),
      wednesday: $(
        "#location-and-hours table tbody tr:nth-child(6) td:nth-child(2) ul li p"
      )
        .text()
        .trim(),
      thursday: $(
        "#location-and-hours table tbody tr:nth-child(8) td:nth-child(2) ul li p"
      )
        .text()
        .trim(),
      friday: $(
        "#location-and-hours table tbody tr:nth-child(10) td:nth-child(2) ul li p"
      )
        .text()
        .trim(),
      saturday: $(
        "#location-and-hours table tbody tr:nth-child(12) td:nth-child(2) ul li p"
      )
        .text()
        .trim(),
      sunday: $(
        "#location-and-hours table tbody tr:nth-child(14) td:nth-child(2) ul li p"
      )
        .text()
        .trim(),
    };
    console.log("Operating Hours:", hours);

    const avgRating = parseFloat(rating);
    if (isNaN(avgRating)) {
      console.error("Failed to parse the average rating.");
    } else {
      console.log("Average Rating:", avgRating);
    }

    // total reviews
    const reviewsText = $('#reviews div[class*="arrange-unit"] p')
      .text()
      .trim();
    console.log("Reviews Text:", reviewsText);

    const totalReviewsMatch = reviewsText.match(/\d+/);
    const totalReviews = totalReviewsMatch
      ? parseInt(totalReviewsMatch[0], 10)
      : 0;
    console.log("Total Reviews:", totalReviews);

    const reviewDetails = [];
    $("#reviews ul li").each((i, el) => {
      // check if empty
      const reviewer = $(el).find('a[href*="/user_details"]').text().trim();
      const reviewComment = $(el).find("p span").text().trim();
      const reviewDate = $(el).find('span:contains("20")').text().trim();
      const reviewRating = $(el)
        .find("svg path")
        .filter(function () {
          return $(this).attr("fill") && $(this).attr("fill") !== "none";
        }).length;

      // push if not empty
      if (reviewer && reviewComment && reviewDate && reviewRating) {
        console.log(`Review ${i + 1} Reviewer:`, reviewer);
        console.log(`Review ${i + 1} Comment:`, reviewComment);
        console.log(`Review ${i + 1} Date:`, reviewDate);
        console.log(`Review ${i + 1} Rating:`, reviewRating);

        reviewDetails.push({
          rating: reviewRating,
          comment: reviewComment,
          reviewDate,
          reviewer,
        });

        console.log(`Review ${i + 1} Details:`, {
          reviewer,
          reviewComment,
          reviewDate,
          reviewRating,
        });
      }
    });

    const ratings = {
      avgRating,
      totalReviews,
      reviewDetails,
    };
    console.log("Ratings Object:", ratings);

    return { shopName, location, hours, ratings };
  } catch (error) {
    console.error("Error scraping data:", error);
    throw new Error("Failed to scrape boba shop data.");
  }
}


async function insertIntoPinecone(data) {
  try {
    // Convert objects into a list of strings
    const hoursList = Object.entries(data.hours).map(([day, hours]) => `${day}: ${hours}`);
    const locationString = `${data.location.address}, ${data.location.city}, ${data.location.state} ${data.location.postalCode}, ${data.location.country}`;
    const ratingsString = `Average Rating: ${data.ratings.avgRating}/5 from ${data.ratings.totalReviews} reviews`;

    const text = `${data.shopName} located in ${data.location.city}, ${data.location.state}. Rating: ${data.ratings.avgRating}/5 from ${data.ratings.totalReviews} reviews. Hours: ${JSON.stringify(data.hours)}. ${data.ratings.reviewDetails.map((review) => review.comment).join(" ")}`;

    console.log("Text for Embedding:", text);

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    console.log("Generated Embedding:", embedding.data[0].embedding);

    await index.upsert([
      {
        id: data.shopName,
        values: embedding.data[0].embedding,
        metadata: {
          location: locationString,
          hours: hoursList,
          ratings: ratingsString,
        },
      },
    ]);
    console.log("Data inserted into Pinecone successfully.");
  } catch (error) {
    console.error("Error inserting data into Pinecone:", error);
    throw new Error(`Failed to insert data into Pinecone: ${error.message}`);
  }
}

// POST route to scrape and upsert to Pinecone
export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error("No URL provided");
    }

    if (!url.includes("yelp.com")) {
      throw new Error("The provided URL is not a valid yelp link.");
    }

    const bobaShopData = await scrapeBobaShopData(url);

    // Validate scraped data
    if (
      !bobaShopData.shopName ||
      !bobaShopData.location ||
      !bobaShopData.hours ||
      !bobaShopData.ratings ||
      !bobaShopData.ratings.reviewDetails.length
    ) {
      throw new Error("Scraped data is incomplete or invalid");
    }

    await insertIntoPinecone(bobaShopData);

    return NextResponse.json({ message: "Boba shop data added successfully." });
  } catch (error) {
    console.error("Error processing request:", error.message);
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}

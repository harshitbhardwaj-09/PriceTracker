"use server";
import axios from "axios";
import * as cheerio from "cheerio";
import {
  extractContent,
  extractCurrency,
  extractDescription,
  extractPrice,
  cleanAmazonUrl,
} from "../utlis";
import { getJson } from "serpapi";
import { connectToDB } from "../mongoose";
import { revalidatePath } from "next/cache";
import Product from "@/models/product.model";
interface Product {
  position: number;
  title: string;
  product_link: string;
  product_id: string;
  serpapi_product_api: string;
  source: string;
  price: string;
  extracted_price: number;
  second_hand_condition?: string;
  rating?: number;
  reviews?: number;
  extensions: any[];
  thumbnail: string;
  delivery?: string;
}

import { redis } from "../../app/config/ratelimit";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(4, "100s"),
});

// Helper to get ScraperAPI key
function getScraperApiKey(): string {
  const key = process.env.SCRAPER_API_KEY;
  if (!key) {
    throw new Error(
      "Missing ScraperAPI key. Set SCRAPER_API_KEY in your environment. Get a key at https://www.scraperapi.com/"
    );
  }
  return key;
}

// Helper to fetch SerpAPI key from env with a sensible fallback and clear error
function getSerpApiKey(): string {
  const key = process.env.SERPAPI_API_KEY || process.env.API_KEY;
  if (!key) {
    throw new Error(
      "Missing SerpAPI API key. Set SERPAPI_API_KEY (preferred) or API_KEY in your environment. Get a key at https://serpapi.com/manage-api-key"
    );
  }
  return key;
}

export async function scrapeAmazonProducts(url: string) {
  const scraperApiKey = getScraperApiKey();

  // Clean the URL - remove tracking parameters that might cause issues
  const cleanUrl = cleanAmazonUrl(url);
  console.log("🔗 Original URL:", url);
  console.log("🔗 Cleaned URL:", cleanUrl);

  // ScraperAPI endpoint - pass the target URL as a parameter
  const scraperApiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(
    cleanUrl
  )}&render=false&country_code=in`;

  const options = {
    timeout: 60000, // ScraperAPI can be slower, increase timeout
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  };

  try {
    // Add random delay to avoid rate limiting
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    console.log(`⏱️ Adding ${Math.round(delay)}ms delay...`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    console.log("🚀 Starting Amazon scrape via ScraperAPI for:", cleanUrl);
    const response = await axios.get(scraperApiUrl, options);
    console.log("✅ Successfully fetched page, status:", response.status);
    console.log("📄 Response size:", response.data.length, "bytes");

    // Check if we're getting blocked
    if (
      response.data.includes("Robot Check") ||
      response.data.includes("To discuss automated access") ||
      response.data.includes("Enter the characters you see below") ||
      response.data.includes(
        "Sorry, we just need to make sure you're not a robot"
      ) ||
      response.data.length < 10000 // Amazon product pages are usually much larger
    ) {
      console.log("🤖 Bot detection triggered - response content preview:");
      console.log(response.data.substring(0, 300));
      throw new Error(
        "🤖 Amazon detected bot activity - requests are being blocked"
      );
    }

    const $ = cheerio.load(response.data);

    // Check what we actually got
    console.log("🏷️ Page title:", $("title").text().trim());
    console.log("🔍 #productTitle exists:", $("#productTitle").length > 0);
    console.log("🔍 .a-price elements found:", $(".a-price").length);

    const title = $("#productTitle").text().trim();
    console.log(
      "📝 Title extracted:",
      title ? "✅ " + title.substring(0, 50) + "..." : "❌ No title found"
    );

    // Extract current price with better targeting
    console.log("🔍 Extracting current price...");
    const currentPrice = extractPrice(
      $(".priceToPay .a-price-whole").first(), // Most specific for current price
      $(".a-price-whole").first(), // Take only first match
      $(".a-size-base.a-color-price").first(),
      $(".a-button-selected .a-color-base").first(),
      $(".a-price .a-offscreen").first() // Take only first match
    );
    console.log(
      "💰 Current price extracted:",
      currentPrice ? "✅ " + currentPrice : "❌ No current price found"
    );

    // Extract original/MRP price with better targeting
    console.log("🔍 Extracting original price...");
    const originalPrice = extractPrice(
      $(".a-price.a-text-price .a-offscreen").first(), // MRP price selector
      $("#listPrice").first(),
      $(".a-text-strike").first(), // Strikethrough price
      $("#priceblock_ourprice").first(),
      $("#priceblock_dealprice").first()
    );
    console.log(
      "💸 Original price extracted:",
      originalPrice ? "✅ " + originalPrice : "❌ No original price found"
    );

    // Debug: If no prices found, let's check what price elements exist
    if (!currentPrice && !originalPrice) {
      console.log("🔍 Debugging price elements:");
      console.log("- .a-price elements found:", $(".a-price").length);
      console.log(
        "- First .a-price text:",
        $(".a-price").first().text().trim()
      );
      console.log("- .a-price-whole elements:", $(".a-price-whole").length);
      console.log(
        "- First .a-price-whole text:",
        $(".a-price-whole").first().text().trim()
      );
      console.log(
        "- #priceblock_ourprice:",
        $("#priceblock_ourprice").text().trim()
      );

      // Check for alternative price selectors with their actual text
      console.log(
        "- .a-price .a-offscreen:",
        $(".a-price .a-offscreen").first().text().trim()
      );
      console.log(
        "- .a-price.a-text-price .a-offscreen (MRP):",
        $(".a-price.a-text-price .a-offscreen").first().text().trim()
      );
      console.log(
        "- .a-text-strike (crossed price):",
        $(".a-text-strike").first().text().trim()
      );
      console.log(
        "- [data-asin-price]:",
        $("[data-asin-price]").first().text().trim()
      );
      console.log(
        "- .a-price-range:",
        $(".a-price-range").first().text().trim()
      );
      console.log("- .priceToPay:", $(".priceToPay").first().text().trim());
      console.log(
        "- .a-price-symbol + .a-price-whole:",
        $(".a-price-symbol").first().text().trim() +
          $(".a-price-whole").first().text().trim()
      );

      // Show first few individual .a-price elements
      console.log("- Individual .a-price elements:");
      $(".a-price")
        .slice(0, 5)
        .each((i, el) => {
          console.log(`  [${i}]:`, $(el).text().trim());
        });
    }

    const outOfStock =
      $("#availability span").text().trim().toLowerCase() ===
      "currently unavailable";

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    let imageUrls: string[] = [];
    try {
      imageUrls = Object.keys(JSON.parse(images));
      console.log(
        "🖼️ Images extracted:",
        imageUrls.length > 0
          ? "✅ " + imageUrls.length + " images"
          : "❌ No images found"
      );
    } catch (e) {
      console.log("⚠️ Image parsing failed, trying fallback...");
      // Fallback to direct image src
      const fallbackImage =
        $("#landingImage").attr("src") ||
        $(".a-dynamic-image").first().attr("src");
      if (fallbackImage) {
        imageUrls = [fallbackImage];
        console.log("🖼️ Fallback image found:", "✅");
      } else {
        console.log("🖼️ No fallback image found:", "❌");
      }
    }

    const currency = extractCurrency($(".a-price-symbol"));
    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const description = extractDescription($);

    const category =
      $("#wayfinding-breadcrumbs_container")
        .find(".a-link-normal")
        .last()
        .text()
        .trim() ||
      $(".nav-a-content img").attr("alt") ||
      $(".nav-categ-image").attr("alt") ||
      $(".nav-a-content").first().text().trim() ||
      $("#nav-subnav").find(".nav-a-content").first().text().trim() ||
      $(".a-subheader").first().text().trim() ||
      "category";

    // Enhanced reviews extraction
    const reviewsCount =
      $("#acrCustomerReviewText")
        .text()
        .replace(/[^0-9]/g, "") ||
      $("[data-automation-id='reviews-block'] span")
        .text()
        .replace(/[^0-9]/g, "") ||
      0;

    // Enhanced ratings extraction
    const stars =
      parseFloat(
        $("#averageCustomerReviews .a-icon-star")
          .text()
          .replace(/[^0-9.]/g, "")
      ) ||
      parseFloat(
        $("[data-automation-id='reviews-block'] .a-icon-star")
          .text()
          .replace(/[^0-9.]/g, "")
      ) ||
      0;

    const fullurl = await getGoogleresult(title || "Product");
    const parts = fullurl?.split("/") || [];
    const geturl = parts.length > 4 ? parts.slice(4).join("/") : "";

    const rawDescription = extractDescription($);
    const cleanDescription = rawDescription
      .replace(/\\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const data = {
      url,
      geturl,
      currency: currency || "$",
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: category,
      reviewsCount: Number(reviewsCount),
      stars: stars,
      isOutOfStock: outOfStock,
      description: cleanDescription,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    };

    console.log(data);

    return data;
  } catch (error: any) {
    console.error("❌ Amazon scraping failed:");
    console.error("Error status:", error.response?.status);
    console.error("Error message:", error.message);
    console.error("Error details:", error.response?.data?.substring(0, 200));

    if (error.message?.includes("Missing ScraperAPI key")) {
      throw new Error(error.message);
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(
        `ScraperAPI authentication failed. Check your SCRAPER_API_KEY in .env`
      );
    } else if (error.response?.status === 503) {
      throw new Error(
        `Amazon temporarily unavailable (503). Try again in a few moments.`
      );
    } else if (error.response?.status === 500) {
      throw new Error(
        `Scraping error (500). The URL might be invalid or temporarily unavailable.`
      );
    } else if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      throw new Error(`Network error: ${error.code}. Check your internet connection.`);
    } else {
      throw new Error(`Error in fetching product: ${error.message}`);
    }
  }
}

export async function googleProductSave(ProductGoogle: Product) {
  console.log(ProductGoogle, "product google");
  try {
    await connectToDB();
    const fullurl = await getGoogleresult(ProductGoogle.title);
    
    // Check if getGoogleresult returned an error
    if (!fullurl || typeof fullurl !== 'string') {
      console.error('Failed to get Google result URL');
      // Use a default URL structure
      const geturl = `products/${Date.now()}`;
      
      const data = {
        url: ProductGoogle.product_link,
        geturl,
        currency: "₹",
        image: ProductGoogle.thumbnail,
        title: ProductGoogle.title,
        currentPrice: ProductGoogle.extracted_price,
        originalPrice: ProductGoogle.extracted_price,
        priceHistory: [],
        discountRate: ProductGoogle.extracted_price + 1000,
        category: "Tech",
        reviewsCount: ProductGoogle.reviews,
        stars: ProductGoogle.rating,
        isOutOfStock: false,
        description: ProductGoogle.title,
        lowestPrice: ProductGoogle.extracted_price - 1000,
        highestPrice: ProductGoogle.extracted_price + 1000,
        averagePrice: ProductGoogle.extracted_price,
      };

      const newProduct = await Product.findOneAndUpdate(
        { url: data.url },
        data,
        { upsert: true, new: true }
      );
      
      const redirectUrl = newProduct._id.toString();
      revalidatePath(`/products/${redirectUrl}`);
      revalidatePath("/", "layout");
      return redirectUrl;
    }
    
    const parts = fullurl.split("/");
    const geturl = parts.slice(4).join("/");
    console.log(geturl);

    const data = {
      url: ProductGoogle.product_link,
      geturl,
      currency: "₹",
      image: ProductGoogle.thumbnail,
      title: ProductGoogle.title,
      currentPrice: ProductGoogle.extracted_price,
      originalPrice: ProductGoogle.extracted_price,
      priceHistory: [],
      discountRate: ProductGoogle.extracted_price + 1000,
      category: "Tech",
      reviewsCount: ProductGoogle.reviews,
      stars: ProductGoogle.rating,
      isOutOfStock: false,
      description: ProductGoogle.title,
      lowestPrice: ProductGoogle.extracted_price - 1000,
      highestPrice: ProductGoogle.extracted_price + 1000,
      averagePrice: ProductGoogle.extracted_price,
    };

    let product = data;

    const existingProduct = await Product.findOne({ url: product.url });

    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: product.currentPrice },
      ];

      product = {
        ...product,
        priceHistory: updatedPriceHistory,
        lowestPrice: ProductGoogle.extracted_price,
        highestPrice: ProductGoogle.extracted_price,
        averagePrice: ProductGoogle.extracted_price,
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: product.url },
      product,
      { upsert: true, new: true }
    );
    const redirectUrl = newProduct._id.toString();
    revalidatePath(`/products/${redirectUrl}`);
    revalidatePath("/", "layout");
    console.log(redirectUrl);
    return redirectUrl;

    // Handle the response data as needed
  } catch (error: any) {
    console.error("Error occurred while fetching data:", error);
    throw new Error(`Failed to save Google product: ${error.message}`);
  }
}
export async function googleShoppingResult(title: string) {
  const ip = headers().get("x-forwarded-for");
  console.log(ip);
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip!
  );
  const pendingResult = await pending;
  console.log(success, pendingResult, limit, reset, remaining);

  if (!success) {
    // Router.push("/blocked");
    return { error: "bhai ab try mt kr" };
  }

  try {
    const apiKey = getSerpApiKey();
    const json = await getJson({
      engine: "google_shopping",
      q: `${title}`,
      location: "India",
      hl: "en",
      gl: "in",
      api_key: apiKey,
      num: 30,
    });

    //  console.log(json["shopping_results"])
    // console.log(json);
    //  console.log(json["related_shopping_results"]);
    // console.log(json["related_searches"]);
    return json["shopping_results"];
  } catch (error) {
    console.error("Error occurred while scraping:", error);
  }
}

export async function getGoogleresult(title: string) {
  const ip = headers().get("x-forwarded-for");
  console.log(ip);
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip!
  );
  const pendingResult = await pending;
  console.log(success, pendingResult, limit, reset, remaining);

  if (!success) {
    console.warn("Rate limit exceeded for getGoogleresult");
    return null; // Return null instead of error object
  }

  try {
    console.log(title);

    const titleWords = title.split(" ");
    let query = titleWords.slice(0, 7).join(" ");

    query = query.replace(/[,|]/g, "");

    query = query.replace(/\s+/g, "-");

    console.log(query);
    const searchTerm = `${encodeURIComponent(
      query
    )}%20site:pricehistoryapp.com`;
    console.log("here");
    console.log(searchTerm);
    const result = await getJson("google", {
      api_key: getSerpApiKey(),
      q: searchTerm,
    });
    console.log(result.organic_results);
    
    if (!result.organic_results || result.organic_results.length === 0) {
      console.warn("No organic results found for:", searchTerm);
      return null;
    }
    
    const jsonresult = result.organic_results;
    const urlproduct = jsonresult[0].link;
    console.log(urlproduct);

    return urlproduct;
  } catch (error: any) {
    console.error(`Error in getGoogleresult: ${error.message}`);
    return null; // Return null on error instead of throwing
  }
}

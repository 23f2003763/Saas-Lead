import { ApifyClient } from 'apify-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// We need a target URL for the webhook to post to. In local dev, this would be localhost.
// In production, it would be your Vercel domain.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!APIFY_API_TOKEN || !WEBHOOK_SECRET) {
    console.error('Missing required environment variables (APIFY_API_TOKEN, WEBHOOK_SECRET).');
    process.exit(1);
}

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: APIFY_API_TOKEN,
});

async function runScraper() {
    console.log('Starting autonomous scraping pipeline...');

    // We use a popular Reddit scraper actor on Apify as an example.
    // Actor ID: process.env.APIFY_ACTOR_ID or a hardcoded one for Reddit scraping.
    // We are using 'trudax/reddit-scraper-lite' as a placeholder example.
    const actorId = 'trudax/reddit-scraper-lite';

    // The input for the Actor. We want to search for intent signals.
    const input = {
        searches: [
            "tired of cold outreach",
            "need a lead gen tool",
            "how to automate sales",
            "b2b saas marketing help"
        ],
        maxItems: 20, // Keep it small for testing
        sort: "new",
        time: "week"
    };

    try {
        console.log(`Calling Apify Actor: ${actorId} with intent keywords...`);
        // Run the Actor and wait for it to finish
        const run = await client.actor(actorId).call(input);

        console.log(`Actor finished. Run ID: ${run.id}. Fetching results...`);

        // Fetch the results from the dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length === 0) {
            console.log('No new leads found in this run.');
            return;
        }

        console.log(`Found ${items.length} potential leads. Processing and formatting...`);

        // Note: You need a real user_id from your Supabase auth table to attribute these leads to.
        // For the sake of this script, we assume you have a specific user_id you want to tie these to,
        // or the webhook logic handles assigning them.
        // If running this autonomously, you should pass a user ID.
        // We'll leave it empty here and let the webhook error out if it requires it,
        // but ideally, you'd pass the ID of the user whose pipeline is being filled.
        const USER_ID = process.env.TARGET_USER_ID || 'replace-with-your-uuid';

        // Format the Apify output to match our webhook expectations
        const formattedLeads = items.map((item: any) => ({
            user_id: USER_ID,
            source: 'Reddit',
            content: item.title + (item.selftext ? `\n\n${item.selftext}` : ''),
            prospect_username: item.author,
            prospect_contact: `https://reddit.com/user/${item.author}`, // Profile link as fallback contact
        }));

        console.log(`Sending ${formattedLeads.length} leads to ingest webhook...`);

        // POST the formatted leads to your Next.js webhook
        const webhookUrl = `${APP_URL}/api/leads/ingest`;
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBHOOK_SECRET}`
            },
            body: JSON.stringify(formattedLeads)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Webhook failed with status ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();
        console.log('Successfully ingested leads:', responseData);

    } catch (error) {
        console.error('Scraping pipeline failed:', error);
    }
}

// Execute the pipeline
runScraper();

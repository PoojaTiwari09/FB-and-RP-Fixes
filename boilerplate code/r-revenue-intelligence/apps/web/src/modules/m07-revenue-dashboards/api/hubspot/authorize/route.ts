import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "HUBSPOT_CLIENT_ID is not set." }, { status: 500 });
  }

  const { origin } = new URL(request.url);
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI || `${origin}/api/hubspot/callback`;

  const scopes = [
    "crm.objects.contacts.read",
    "crm.objects.companies.read",
    "crm.objects.deals.read",
    "crm.objects.goals.read",
    "crm.objects.owners.read",
    "crm.objects.quotes.read",
    "crm.schemas.companies.read",
    "crm.schemas.contacts.read",
    "crm.schemas.custom.read",
    "crm.schemas.deals.read",
    "sales-email-read",
    "tickets",
  ].join(" ");

  const oauthUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

  // Send users to HubSpot login first with the OAuth URL as post-login redirect.
  // This ensures an active HubSpot session exists before hitting oauth/authorize,
  // which fixes the hub-user-info 400 error caused by missing session cookies.
  const loginUrl = `https://app.hubspot.com/login?loginRedirectUrl=${encodeURIComponent(oauthUrl)}`;

  return NextResponse.redirect(loginUrl);
}

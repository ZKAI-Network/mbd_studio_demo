import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { wallet, numStories = 25 } = await req.json();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    }

    const res = await fetch("https://api.mbd.xyz/v3/studio/stories/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MBD_API_KEY}`,
      },
      body: JSON.stringify({
        engine: "polymarket_v2",
        params: { wallet, num_stories: numStories, new_market_hours: 24 },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Stories API error:", res.status, text);
      return NextResponse.json(
        { error: "Stories request failed", detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Stories error:", error);
    return NextResponse.json(
      { error: "Stories failed", detail: String(error) },
      { status: 500 }
    );
  }
}

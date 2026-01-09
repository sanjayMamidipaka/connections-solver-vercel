// frontend/app/api/connections/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://www.nytimes.com/svc/connections/v2/${today}.json`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`NYT API failed: ${response.status}`);
    
    const data = await response.json();

    // Map through the categories to extract content from the cards
    const allWords = data.categories.flatMap((category: any) => 
      category.cards.map((card: any) => card.content)
    );

    return NextResponse.json({ words: allWords });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to load puzzle' }, { status: 500 });
  }
}
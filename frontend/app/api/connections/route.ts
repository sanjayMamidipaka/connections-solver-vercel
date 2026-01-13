// frontend/app/api/connections/route.ts
import { NextResponse } from 'next/server';

// This forces the API route to be dynamic and not cached
export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // Specify the timezone to ensure "today" matches NYT release time (EST)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const url = `https://www.nytimes.com/svc/connections/v2/${today}.json`;

    // Add { cache: 'no-store' } to ensure the fetch itself isn't cached
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) throw new Error(`NYT API failed: ${response.status}`);
    
    const data = await response.json();
    const allWords = data.categories.flatMap((category: any) => 
      category.cards.map((card: any) => card.content)
    );

    return NextResponse.json({ words: allWords, date: today });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load puzzle' }, { status: 500 });
  }
}
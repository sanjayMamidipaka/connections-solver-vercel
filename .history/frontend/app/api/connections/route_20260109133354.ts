import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://www.nytimes.com/svc/connections/v2/${today}.json`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`NYT API failed: ${response.status}`);
    
    const data = await response.json();

    // Based on your JSON output, we map through categories to get the words
    const allWords = data.categories.flatMap((category: any) => 
      category.cards.map((card: any) => card.content)
    );

    // Safety check: ensure we actually got 16 words
    if (allWords.length !== 16) {
      console.error("Unexpected word count:", allWords.length);
    }

    return NextResponse.json({ words: allWords });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
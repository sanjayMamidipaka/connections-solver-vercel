import { log } from 'console';
import { NextResponse } from 'next/server';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  console.log(today);
  const url = 'https://www.nytimes.com/svc/connections/v2/2026-01-09.json';

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch puzzle');
    console.log(response);
    const data = await response.json();
    
    // NYT returns 4 groups of 4 words. We flatten them for your grid.
    const allWords = data.startingGroups.flatMap((group: any) => group.words);
    
    return NextResponse.json({ words: allWords });
  } catch (error) {
    return NextResponse.json({ error: 'Could not load today\'s puzzle' }, { status: 500 });
  }
}
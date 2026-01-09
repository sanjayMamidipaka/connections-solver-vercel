'use client'

import { useEffect, useState } from 'react'

interface SolveResponse {
  rank: number
  score: number
  groups: string[][]
}

const INITIAL_WORDS = ["coil", "reel", "scan", "tackle", "crank", "drear", "grump", "sack", "blitz", "block", "etail", "wind", "copy", "edition", "issue", "print"]

const CATEGORY_COLORS = ['#fbbf24', '#4ade80', '#60a5fa', '#a78bfa'] // Yellow, Green, Blue, Purple

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SolveResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [words, setWords] = useState<string[]>(INITIAL_WORDS)
  const [newWord, setNewWord] = useState('')
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [previousGuesses, setPreviousGuesses] = useState<string[][]>([])
  const [oneAways, setOneAways] = useState<string[][]>([])
  const [successfulGuesses, setSuccessfulGuesses] = useState<string[][]>([])

  const fetchTodayPuzzle = async () => { //get today's puzzle
    setLoading(true);
    try {
      const response = await fetch('/api/connections');
      const data = await response.json();
      if (data.words) {
        setWords(data.words);
        setError(null);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Failed to fetch today\'s words.');
    } finally {
      setLoading(false);
    }
  };

  const handleSolve = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          words: words,
          successful_guesses: successfulGuesses,
          failed_guesses: previousGuesses,
          one_away_guesses: oneAways
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: SolveResponse[] = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWord = () => {
    if (newWord.trim() && words.length < 16) {
      setWords([...words, newWord.trim().toLowerCase()])
      setNewWord('')
    }
  }

  const handleRemoveWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index))
  }

  const handleRemovePreviousGuess = (index: number) => {
    setPreviousGuesses(previousGuesses.filter((_, i) => i !== index))
  }

  const handleRemoveOneAway = (index: number) => {
    setOneAways(oneAways.filter((_, i) => i !== index))
  }

  const handleRemoveSuccessful = (index: number) => {
    setSuccessfulGuesses(successfulGuesses.filter((_, i) => i !== index))
  }

  const toggleWordSelection = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word))
    } else {
      if (selectedWords.length < 4) {
        setSelectedWords([...selectedWords, word])
      }
    }
  }

  const addToPreviousGuesses = () => {
    if (selectedWords.length === 4) {
      setPreviousGuesses([...previousGuesses, [...selectedWords]])
      setSelectedWords([])
    }
  }

  const addToOneAways = () => {
    if (selectedWords.length === 4) {
      setOneAways([...oneAways, [...selectedWords]])
      setSelectedWords([])
    }
  }

  const addToSuccessfulGuesses = () => {
    if (selectedWords.length === 4) {
      setSuccessfulGuesses([...successfulGuesses, [...selectedWords]])
      setSelectedWords([])
    }
  }

  const clearSelection = () => {
    setSelectedWords([])
  }

  const getCategoryName = (rank: number): string => {
    const categories = ['YELLOW', 'GREEN', 'BLUE', 'PURPLE']
    return categories[rank - 1] || 'UNKNOWN'
  }

  const getCategoryColor = (rank: number): string => {
    return CATEGORY_COLORS[rank - 1] || CATEGORY_COLORS[0]
  }

  useEffect(() => {
    fetchTodayPuzzle();
  }, []);

  return (
    <div className="app-container">
      <div className="header">
        <h1>Connections AI Solver</h1>
        <div className="user-icon">👤</div>
      </div>
      
      <div className="main-content">
        <div className="panel inputs-panel">
          <h2 className="panel-title">INPUTS</h2>
          
          <div className="section">
            <h3 className="section-title">TODAY'S WORDS:</h3>
            <button 
              className="fetch-btn" 
              onClick={fetchTodayPuzzle}
              disabled={loading}
            >
              {loading ? 'Fetching...' : 'Fetch Today\'s Puzzle'}
            </button>
            
            <div className="word-grid">
              {words.map((word, index) => {
                const isSelected = selectedWords.includes(word)
                return (
                  <div
                    key={index}
                    className={`word-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleWordSelection(word)}
                  >
                    <span>{word.toUpperCase()}</span>
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveWord(index)
                      }}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
            {selectedWords.length > 0 && (
              <div className="selection-controls">
                <div className="selected-words-display">
                  Selected ({selectedWords.length}/4): {selectedWords.map(w => w.toUpperCase()).join(', ')}
                </div>
                <div className="add-buttons">
                  <button
                    className="add-guess-btn failed-btn"
                    onClick={addToPreviousGuesses}
                    disabled={selectedWords.length !== 4}
                  >
                    Add to Failed
                  </button>
                  <button
                    className="add-guess-btn one-away-btn"
                    onClick={addToOneAways}
                    disabled={selectedWords.length !== 4}
                  >
                    Add to One Away
                  </button>
                  <button
                    className="add-guess-btn success-btn"
                    onClick={addToSuccessfulGuesses}
                    disabled={selectedWords.length !== 4}
                  >
                    Add to Successful
                  </button>
                  <button className="clear-selection-btn" onClick={clearSelection}>
                    Clear
                  </button>
                </div>
              </div>
            )}
            <div className="word-input-container">
              <input
                type="text"
                className="word-input"
                placeholder="Enter your word..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
              />
              <button className="add-word-btn" onClick={handleAddWord}>Add</button>
            </div>
          </div>

          <div className="section">
            <h3 className="section-title">PREVIOUS GUESSES:</h3>
            {previousGuesses.length === 0 ? (
              <p className="empty-state">No previous guesses</p>
            ) : (
              <div className="guesses-list">
                {previousGuesses.map((guess, index) => (
                  <div key={index} className="guess-row failed">
                    <div className="guess-words">
                      {guess.map((word, i) => (
                        <span key={i} className="guess-word">{word.toUpperCase()}</span>
                      ))}
                    </div>
                    <button className="remove-icon" onClick={() => handleRemovePreviousGuess(index)}>
                      ✗
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section">
            <h3 className="section-title">ONE AWAYS:</h3>
            {oneAways.length === 0 ? (
              <p className="empty-state">No one away guesses</p>
            ) : (
              <div className="guesses-list">
                {oneAways.map((guess, index) => (
                  <div key={index} className="guess-row one-away">
                    <div className="guess-words">
                      {guess.map((word, i) => (
                        <span key={i} className="guess-word">{word.toUpperCase()}</span>
                      ))}
                    </div>
                    <button className="warning-icon" onClick={() => handleRemoveOneAway(index)}>
                      ⚠
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section">
            <h3 className="section-title">SUCCESSFUL GUESSES:</h3>
            {successfulGuesses.length === 0 ? (
              <p className="empty-state">No successful guesses</p>
            ) : (
              <div className="guesses-list">
                {successfulGuesses.map((guess, index) => (
                  <div key={index} className="guess-row successful">
                    <div className="guess-words">
                      {guess.map((word, i) => (
                        <span key={i} className="guess-word">{word.toUpperCase()}</span>
                      ))}
                    </div>
                    <button className="remove-icon success-remove" onClick={() => handleRemoveSuccessful(index)}>
                      ✗
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel solutions-panel">
          <h2 className="panel-title">OPTIONS & SOLUTIONS</h2>
          
          <button className="generate-button" onClick={handleSolve} disabled={loading}>
            {loading ? 'GENERATING...' : 'GENERATE SOLUTIONS'}
          </button>

          {error && (
            <div className="error-message">
              Error: {error}
            </div>
          )}

          {results && results.length > 0 && (
            <div className="solutions-list">
              {results.map((result) => {
                const probability = result.score * 100
                return (
                  <div key={result.rank} className="solution-item-modern">
                    <div className="solution-header-plain">
                      <span className="rank-label">RANK #{result.rank}</span>
                      <span className="probability-label">
                        Probability: {probability.toFixed(4)}%
                      </span>
                    </div>
                    
                    <div className="groups-container">
                      {result.groups.map((group, groupIdx) => (
                        <div key={groupIdx} className="group-row-plain">
                          <span className="group-number">{groupIdx + 1}</span>
                          <div className="group-words-plain">
                            {group.join(' • ').toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
        </div>
)}
        </div>
      </div>
    </div>
  )
}

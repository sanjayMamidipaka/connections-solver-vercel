from pydantic import BaseModel
from typing import List, Tuple, Optional


class SolveRequest(BaseModel):
    words: List[str]
    successful_guesses: Optional[List[List[str]]] = []
    failed_guesses: Optional[List[List[str]]] = []
    one_away_guesses: Optional[List[List[str]]] = []


class SolveResponse(BaseModel):
    rank: int
    score: float
    groups: List[List[str]]

import itertools
import numpy as np
from sentence_transformers import SentenceTransformer, util
from typing import List, Set, Tuple, Optional


class TransformerSolver:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the model once on startup to save memory and latency.
        """
        self.model = SentenceTransformer(model_name)
        self.words: List[str] = []
        self.embeddings: dict = {}
        self.active_words: List[str] = []
        self.successful: List[Set[str]] = []
        self.failed: List[Set[str]] = []
        self.one_away: List[Set[str]] = []
        self.beam_width: int = 5
        self.alpha: float = 0.5

    def update_state(
        self,
        words: List[str],
        successful: Optional[List[List[str]]] = None,
        failed: Optional[List[List[str]]] = None,
        one_away: Optional[List[List[str]]] = None
    ):
        """
        Update the solver with the current game state from the API request.
        """
        self.words = words
        self.successful = [set(s) for s in (successful or [])]
        self.failed = [set(f) for f in (failed or [])]
        self.one_away = [set(o) for o in (one_away or [])]

        # Filter out already solved words
        solved_words = set().union(*self.successful) if self.successful else set()
        self.active_words = [w for w in words if w not in solved_words]

        # Pre-calculate embeddings for the current session
        self.embeddings = {word: self.model.encode(
            word.lower()) for word in words}

    def get_group_score(self, group: Tuple[str, ...], remaining: List[str]) -> float:
        group_set = set(group)

        # 1. Hard Filter: Prevent re-guessing failures
        if group_set in self.failed or group_set in self.one_away:
            return 0.0

        # 2. Mean Cosine Similarity (Internal Coherence)
        group_vecs = np.array([self.embeddings[w] for w in group])
        sim_matrix = util.cos_sim(group_vecs, group_vecs).numpy()
        mean_similarity = np.mean(sim_matrix[np.triu_indices(len(group), k=1)])

        # 3. Red Herring Penalty (Contextual Isolation)
        others = [w for w in remaining if w not in group_set]
        penalty = 0
        if others:
            other_vecs = np.array([self.embeddings[w] for w in others])
            ext_sim_matrix = util.cos_sim(group_vecs, other_vecs).numpy()
            penalty = np.mean(ext_sim_matrix)

        score = mean_similarity - (self.alpha * penalty)

        # 4. Feedback Logic (Bayesian Constraints)
        for past_guess in self.one_away:
            if len(group_set & past_guess) == 3:
                score += 0.4
        for past_fail in self.failed:
            if len(group_set & past_fail) == 3:
                score -= 0.2

        return max(0.001, score)

    def solve(self) -> List[Tuple[List[Tuple[str, ...]], float, List[str]]]:
        num_groups = len(self.active_words) // 4
        if num_groups == 0:
            return []

        # Beam structure: (path, cumulative_score, remaining_words)
        beam = [([], 1.0, self.active_words)]

        for _ in range(num_groups):
            new_candidates = []
            for path, current_prob, remaining in beam:
                combos = list(itertools.combinations(remaining, 4))
                for combo in combos:
                    score = self.get_group_score(combo, remaining)
                    new_prob = current_prob * score
                    new_candidates.append(
                        (path + [combo], new_prob, [w for w in remaining if w not in combo]))

            # Sort and prune to keep top-N paths
            new_candidates.sort(key=lambda x: x[1], reverse=True)
            beam = new_candidates[:self.beam_width]

        return beam

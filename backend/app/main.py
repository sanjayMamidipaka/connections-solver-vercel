from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.solver import TransformerSolver
from app.schemas import SolveRequest, SolveResponse
from app.config import settings
from typing import List

# Shared resource to be initialized on startup
ml_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup
    print(f"Loading {settings.model_name}...")
    ml_models["solver"] = TransformerSolver(model_name=settings.model_name)
    yield
    # Clean up on shutdown
    ml_models.clear()

app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Setup CORS for React/Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/solve", response_model=List[SolveResponse])
async def solve_puzzle(request: SolveRequest):
    solver = ml_models["solver"]

    # Initialize solver with current game state
    solver.update_state(
        words=request.words,
        successful=request.successful_guesses,
        failed=request.failed_guesses,
        one_away=request.one_away_guesses
    )

    results = solver.solve()

    # Format for response
    return [
        SolveResponse(rank=i+1, score=score, groups=groups)
        for i, (groups, score, _) in enumerate(results)
    ]

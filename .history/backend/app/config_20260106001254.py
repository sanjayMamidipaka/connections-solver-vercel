from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Connections Solver AI"
    model_name: str = "google/embeddinggemma-300m"
    beam_width: int = 10

    # In production, this should be your Vercel URL
    allowed_origins: list[str] = ["*"]


settings = Settings()

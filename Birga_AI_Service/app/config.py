from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    database_url: str
    jwt_secret: str
    cors_origins: str = "https://birga-quramiz.uz"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

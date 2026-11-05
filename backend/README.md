# Document Copilot Backend

The backend is the Python and FastAPI service behind Document Copilot, an internal research assistant for Driftwood Capital. It gives analysts a secure way to ask questions about company filings, keep chat history, and eventually receive answers grounded in the original documents.

This README is written as a project guide for a fresher preparing to discuss the application in interviews.

## The problem this solves

Investment analysts spend a large part of their week reading 10-K and 10-Q filings, finding relevant passages, and comparing companies across years. Document Copilot is designed to shorten that intake work without hiding the evidence:

- An analyst asks a question in plain English.
- The system searches the approved filing corpus.
- The assistant returns an answer with the source filing, page, and passage.
- The analyst can verify the evidence before using it in research.

The key product rule is that a confident answer without evidence is not useful for this business. The system must say when the corpus does not support an answer.

## Business benefit

For Driftwood Capital, the backend supports a faster and more reliable research workflow:

| Business outcome | How the backend helps |
| --- | --- |
| More analyst capacity | Reduces repetitive filing search and copy-paste work, leaving more time for original analysis. |
| Faster client research | Analysts can find comparable facts across companies and years from one interface. |
| Better trust | Authentication, source passages, and grounded responses make answers easier to verify. |
| Reusable firm knowledge | Conversations and indexed filings create a consistent starting point for the whole research team. |
| Controlled operating cost | FastAPI, Supabase, and a small cloud deployment fit a lean internal tool. |

The pilot success measure is practical: five senior analysts should save at least three hours per week before a firm-wide rollout is considered.

## What is implemented 

The current backend includes:

- A FastAPI application with CORS configuration and a `/health` endpoint.
- Supabase Auth-based current-user dependencies.
- Authenticated chat thread creation and listing.
- Ownership checks before a user can read or stream a thread.
- Chat message persistence in Supabase.
- A plain-text streaming endpoint at `POST /chat/stream`.
- Alembic migrations and SQLAlchemy database metadata.

The assistant response is currently a stub. Document retrieval, embeddings, citation validation, and grounded LLM answers are the next product layer; they should not be described as finished functionality yet.

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)
- A Supabase project ([setup guide](../docs/guides/supabase-setup.md))
- An OpenAI API key for the future LLM and embedding layer

## Setup

From this directory:

```bash
uv sync
```

Create `.env` from the example file. On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in every required value. The app fails on startup if required configuration is missing.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only secret key |
| `DATABASE_URL` | Direct Postgres connection for Alembic and database access |
| `OPENAI_API_KEY` | OpenAI API key |
| `ALLOWED_ORIGINS` | Comma-separated browser origins, such as `http://localhost:5173` |

Use the direct Supabase database URL (`db.<ref>.supabase.co`), not the transaction pooler, for `DATABASE_URL`.

Optional values are documented in `.env.example`, including the embedding model and dimensions.

## Run and verify

```bash
uv run uvicorn app.main:app --reload
```

The API listens on `http://localhost:8000`.

Health check:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

FastAPI also provides interactive documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development commands

```bash
# Check style
uv run ruff check .

# Run the fast test suite
uv run pytest -m "not integration"

# Apply database migrations
uv run alembic upgrade head
```

## Project layout

```text
backend/
├── app/
│   ├── main.py                 # FastAPI entrypoint
│   ├── config.py               # Single source of truth for environment settings
│   ├── auth/                   # Current-user authentication dependency
│   ├── chat/                   # Chat routes and response streaming
│   └── database/               # Supabase client and database models
├── alembic/                    # Reviewed database migrations
├── tests/                      # Unit and integration tests
└── pyproject.toml              # Dependencies and tool configuration
```

All environment reads go through `app.config.settings`. Do not call `os.getenv` or load dotenv files from application modules.

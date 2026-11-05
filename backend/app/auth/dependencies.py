"""FastAPI dependencies for JWT authentication via Supabase Auth."""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database.supabase import create_user_client

security = HTTPBearer()


class CurrentUser:
    """Represents the authenticated user extracted from JWT."""

    def __init__(self, user_id: uuid.UUID, email: str):
        self.user_id = user_id
        self.email = email


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> CurrentUser:
    """
    Extract and validate the Supabase JWT from the Authorization header.

    Raises:
        HTTPException(401): If the token is missing, invalid, or expired.

    Returns:
        CurrentUser: The authenticated user's ID and email.
    """
    token = credentials.credentials

    try:
        # Create a user-scoped Supabase client with the provided token
        client = await create_user_client(token)

        # Verify the token by attempting to get the current user from Supabase Auth
        user = await client.auth.get_user(token)

        # Extract user ID and email
        user_id = uuid.UUID(user.user.id)
        email = user.user.email or ""

        return CurrentUser(user_id=user_id, email=email)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e

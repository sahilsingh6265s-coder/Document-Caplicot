from __future__ import annotations

import asyncio
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.auth.dependencies import CurrentUser, get_current_user
from app.database.supabase import get_service_role_client

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/threads")
async def list_threads(current_user: CurrentUser = Depends(get_current_user)) -> Any:
    client = await get_service_role_client()
    resp = await client.table("chat_threads").select("*").eq("user_id", str(current_user.user_id)).order("updated_at", desc=True).execute()
    return {"data": resp.data}


@router.post("/threads")
async def create_thread(payload: dict, current_user: CurrentUser = Depends(get_current_user)) -> Any:
    title = payload.get("title") or "New chat"
    client = await get_service_role_client()
    insert = {
        "user_id": str(current_user.user_id),
        "title": title,
    }
    resp = await client.table("chat_threads").insert(insert).execute()
    return {"data": resp.data}


@router.get("/threads/{thread_id}")
async def get_thread(thread_id: uuid.UUID, current_user: CurrentUser = Depends(get_current_user)) -> Any:
    client = await get_service_role_client()

    # verify ownership
    t = await client.table("chat_threads").select("*").eq("id", str(thread_id)).single().execute()
    if not t.data or t.data.get("user_id") != str(current_user.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    msgs = await client.table("chat_messages").select("*").eq("thread_id", str(thread_id)).order("sequence", asc=True).execute()
    return {"thread": t.data, "messages": msgs.data}


async def _stream_stub_response(text: str):
    """Yield small chunks of text with short delays to simulate streaming."""
    for i in range(0, len(text), 40):
        chunk = text[i : i + 40]
        yield chunk
        await asyncio.sleep(0.05)


@router.post("/stream")
async def post_stream(payload: dict, current_user: CurrentUser = Depends(get_current_user)) -> StreamingResponse:
    """
    Expected payload: {"thread_id": "<uuid>", "messages": [{"role":"user","content":"..."}, ...]}
    Streams a stubbed assistant reply and persists messages when complete.
    """
    thread_id = payload.get("thread_id")
    if thread_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="thread_id required")

    try:
        thread_uuid = uuid.UUID(thread_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid thread_id")

    client = await get_service_role_client()
    # ownership check
    t = await client.table("chat_threads").select("*").eq("id", str(thread_uuid)).single().execute()
    if not t.data or t.data.get("user_id") != str(current_user.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    messages = payload.get("messages") or []
    user_message_text = None
    for m in messages:
        if m.get("role") == "user":
            user_message_text = m.get("content")
            break

    # determine next sequence
    seq_resp = await client.table("chat_messages").select("sequence").eq("thread_id", str(thread_uuid)).order("sequence", desc=True).limit(1).execute()
    max_seq = 0
    if seq_resp.data:
        try:
            max_seq = int(seq_resp.data[0].get("sequence") or 0)
        except Exception:
            max_seq = 0

    # persist user message (if present)
    if user_message_text:
        user_msg = {
            "thread_id": str(thread_uuid),
            "role": "user",
            "content": user_message_text,
            "sequence": max_seq + 1,
        }
        await client.table("chat_messages").insert(user_msg).execute()
        max_seq += 1

    # prepare assistant stub
    assistant_text = "This is a stubbed assistant reply. Replace with real agent later."

    async def generator():
        # stream chunks
        async for chunk in _stream_stub_response(assistant_text):
            yield chunk

        # after streaming completes, persist assistant message
        assistant_msg = {
            "thread_id": str(thread_uuid),
            "role": "assistant",
            "content": assistant_text,
            "sequence": max_seq + 1,
        }
        await client.table("chat_messages").insert(assistant_msg).execute()

    return StreamingResponse(generator(), media_type="text/plain")

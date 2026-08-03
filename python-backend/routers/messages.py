from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from datetime import datetime

from db import get_connection

router = APIRouter()


class MessageBase(BaseModel):
    sender_id: int
    receiver_id: int
    message_text: str
    sent_date: str

    @field_validator("message_text")
    @classmethod
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Message text cannot be empty.")
        return v.strip()

    @field_validator("sent_date")
    @classmethod
    def parse_sent_date(cls, v):
        formats = (
            "%Y-%m-%dT%H:%M",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
        )

        for fmt in formats:
            try:
                datetime.strptime(v, fmt)
                return v
            except ValueError:
                pass

        raise ValueError(
            f"sent_date '{v}' is not in a recognised format. "
            "Use YYYY-MM-DDTHH:MM."
        )

    @field_validator("receiver_id")
    @classmethod
    def sender_receiver_differ(cls, v, info):
        sender = info.data.get("sender_id")
        if sender is not None and sender == v:
            raise ValueError("Sender and Receiver cannot be the same user.")
        return v


class MessageCreate(MessageBase):
    message_id: int


class MessageUpdate(MessageBase):
    pass


def _to_oracle_ts(dt_str: str) -> str:
    return dt_str.replace("T", " ") + (":00" if len(dt_str) == 16 else "")


@router.get("/newid")
def get_new_message_id():
    connection = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT NVL(MAX(MESSAGE_ID), 0) + 1 FROM USER_MESSAGES")
        row = cursor.fetchone()

        return {
            "success": True,
            "message_id": row[0]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/")
def get_all_messages():
    connection = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                MESSAGE_ID,
                SENDER_ID,
                RECEIVER_ID,
                TO_CHAR(SENT_DATE, 'YYYY-MM-DD"T"HH24:MI')
            FROM USER_MESSAGES
            ORDER BY MESSAGE_ID
            """
        )

        rows = cursor.fetchall()

        data = [
            {
                "message_id": row[0],
                "sender_id": row[1],
                "receiver_id": row[2],
                "sent_date": row[3],
            }
            for row in rows
        ]

        return {
            "success": True,
            "data": data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/{message_id}")
def get_message(message_id: int):
    connection = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                MESSAGE_ID,
                SENDER_ID,
                RECEIVER_ID,
                MESSAGE_TEXT,
                TO_CHAR(SENT_DATE, 'YYYY-MM-DD"T"HH24:MI')
            FROM USER_MESSAGES
            WHERE MESSAGE_ID = :id
            """,
            {"id": message_id},
        )

        row = cursor.fetchone()

        if not row:
            return {
                "success": False,
                "message": "Message not found."
            }

        message_text = row[3]
        if hasattr(message_text, "read"):
            message_text = message_text.read()

        return {
            "success": True,
            "data": {
                "message_id": row[0],
                "sender_id": row[1],
                "receiver_id": row[2],
                "message_text": message_text,
                "sent_date": row[4],
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.post("/")
def create_message(payload: MessageCreate):
    connection = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO USER_MESSAGES
            (
                MESSAGE_ID,
                SENDER_ID,
                RECEIVER_ID,
                MESSAGE_TEXT,
                SENT_DATE
            )
            VALUES
            (
                :message_id,
                :sender_id,
                :receiver_id,
                :message_text,
                TO_TIMESTAMP(:sent_date, 'YYYY-MM-DD HH24:MI:SS')
            )
            """,
            {
                "message_id": payload.message_id,
                "sender_id": payload.sender_id,
                "receiver_id": payload.receiver_id,
                "message_text": payload.message_text,
                "sent_date": _to_oracle_ts(payload.sent_date),
            },
        )

        connection.commit()

        return {
            "success": True,
            "message": "Message saved successfully."
        }

    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.put("/{message_id}")
def update_message(message_id: int, payload: MessageUpdate):
    connection = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE USER_MESSAGES
            SET
                SENDER_ID = :sender_id,
                RECEIVER_ID = :receiver_id,
                MESSAGE_TEXT = :message_text,
                SENT_DATE = TO_TIMESTAMP(:sent_date, 'YYYY-MM-DD HH24:MI:SS')
            WHERE MESSAGE_ID = :message_id
            """,
            {
                "message_id": message_id,
                "sender_id": payload.sender_id,
                "receiver_id": payload.receiver_id,
                "message_text": payload.message_text,
                "sent_date": _to_oracle_ts(payload.sent_date),
            },
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Message not found."
            }

        connection.commit()

        return {
            "success": True,
            "message": "Message updated successfully."
        }

    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.delete("/{message_id}")
def delete_message(message_id: int):
    connection = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM USER_MESSAGES WHERE MESSAGE_ID = :id",
            {"id": message_id},
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Message not found."
            }

        connection.commit()

        return {
            "success": True,
            "message": "Message deleted successfully."
        }

    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()
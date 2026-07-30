from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from db import get_connection

router = APIRouter()


class AuditLogBase(BaseModel):
    user_id: int
    action: str
    action_date: datetime


class AuditLogCreate(AuditLogBase):
    audit_id: int


class AuditLogUpdate(AuditLogBase):
    pass


class AuditLogResponse(BaseModel):
    audit_id: int
    user_id: int
    action: str
    action_date: str


@router.get("/newid")
def get_new_audit_id():
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT NVL(MAX(AUDIT_ID),0)+1 FROM AUDIT_LOG"
        )

        audit_id = cursor.fetchone()[0]

        return {
            "success": True,
            "audit_id": audit_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/")
def get_all_audit_logs():
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                AUDIT_ID,
                USER_ID,
                ACTION,
                TO_CHAR(ACTION_DATE, 'YYYY-MM-DD"T"HH24:MI:SS')
            FROM AUDIT_LOG
            ORDER BY AUDIT_ID
            """
        )

        rows = cursor.fetchall()

        audit_logs = []
        for row in rows:
            audit_logs.append(
                {
                    "audit_id": row[0],
                    "user_id": row[1],
                    "action": row[2],
                    "action_date": row[3],
                }
            )

        return {
            "success": True,
            "data": audit_logs,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/{audit_id}")
def get_audit_log(audit_id: int):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                AUDIT_ID,
                USER_ID,
                ACTION,
                TO_CHAR(ACTION_DATE, 'YYYY-MM-DD"T"HH24:MI:SS')
            FROM AUDIT_LOG
            WHERE AUDIT_ID = :id
            """,
            {"id": audit_id},
        )

        row = cursor.fetchone()

        if row is None:
            return {
                "success": False,
                "message": "Audit log not found.",
            }

        return {
            "success": True,
            "data": {
                "audit_id": row[0],
                "user_id": row[1],
                "action": row[2],
                "action_date": row[3],
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.post("/")
def create_audit_log(payload: AuditLogCreate):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO AUDIT_LOG
            (
                AUDIT_ID,
                USER_ID,
                ACTION,
                ACTION_DATE
            )
            VALUES
            (
                :audit_id,
                :user_id,
                :action,
                :action_date
            )
            """,
            {
                "audit_id": payload.audit_id,
                "user_id": payload.user_id,
                "action": payload.action,
                "action_date": payload.action_date,
            },
        )

        connection.commit()

        return {
            "success": True,
            "message": "Audit log saved successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.put("/{audit_id}")
def update_audit_log(audit_id: int, payload: AuditLogUpdate):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE AUDIT_LOG
            SET
                USER_ID = :user_id,
                ACTION = :action,
                ACTION_DATE = :action_date
            WHERE AUDIT_ID = :audit_id
            """,
            {
                "audit_id": audit_id,
                "user_id": payload.user_id,
                "action": payload.action,
                "action_date": payload.action_date,
            },
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Audit log not found.",
            }

        connection.commit()

        return {
            "success": True,
            "message": "Audit log updated successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()
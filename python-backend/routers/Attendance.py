from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date

from db import get_connection

router = APIRouter()


class AttendanceBase(BaseModel):
    attendance_date: date
    student_id: int
    batch_id: int
    status: str


class AttendanceCreate(AttendanceBase):
    attendance_id: int


class AttendanceUpdate(AttendanceBase):
    pass


class AttendanceResponse(BaseModel):
    attendance_id: int
    attendance_date: str
    student_id: int
    batch_id: int
    status: str


@router.get("/newid")
def get_new_attendance_id():
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT NVL(MAX(ATTENDANCE_ID), 0) + 1 FROM ATTENDANCE"
        )

        attendance_id = cursor.fetchone()[0]

        return {
            "success": True,
            "attendance_id": attendance_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/")
def get_all_attendance():
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                ATTENDANCE_ID,
                TO_CHAR(ATTENDANCE_DATE, 'YYYY-MM-DD'),
                STUDENT_ID,
                BATCH_ID,
                STATUS
            FROM ATTENDANCE
            ORDER BY ATTENDANCE_ID
            """
        )

        rows = cursor.fetchall()

        records = []
        for row in rows:
            records.append(
                {
                    "attendance_id": row[0],
                    "attendance_date": row[1],
                    "student_id": row[2],
                    "batch_id": row[3],
                    "status": row[4],
                }
            )

        return {
            "success": True,
            "data": records,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/{attendance_id}")
def get_attendance(attendance_id: int):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                ATTENDANCE_ID,
                TO_CHAR(ATTENDANCE_DATE, 'YYYY-MM-DD'),
                STUDENT_ID,
                BATCH_ID,
                STATUS
            FROM ATTENDANCE
            WHERE ATTENDANCE_ID = :id
            """,
            {"id": attendance_id},
        )

        row = cursor.fetchone()

        if row is None:
            return {
                "success": False,
                "message": "Attendance record not found.",
            }

        return {
            "success": True,
            "data": {
                "attendance_id": row[0],
                "attendance_date": row[1],
                "student_id": row[2],
                "batch_id": row[3],
                "status": row[4],
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.post("/")
def create_Attendance(payload: AttendanceCreate):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO ATTENDANCE
            (
                ATTENDANCE_ID,
                ATTENDANCE_DATE,
                STUDENT_ID,
                BATCH_ID,
                STATUS
            )
            VALUES
            (
                :attendance_id,
                TO_DATE(:attendance_date, 'YYYY-MM-DD'),
                :student_id,
                :batch_id,
                :status
            )
            """,
            {
                "attendance_id": payload.attendance_id,
                "attendance_date": str(payload.attendance_date),
                "student_id": payload.student_id,
                "batch_id": payload.batch_id,
                "status": payload.status,
            },
        )

        connection.commit()

        return {
            "success": True,
            "message": "Attendance saved successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.put("/{attendance_id}")
def update_attendance(attendance_id: int, payload: AttendanceUpdate):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE ATTENDANCE
            SET
                ATTENDANCE_DATE = TO_DATE(:attendance_date, 'YYYY-MM-DD'),
                STUDENT_ID = :student_id,
                BATCH_ID = :batch_id,
                STATUS = :status
            WHERE ATTENDANCE_ID = :attendance_id
            """,
            {
                "attendance_id": attendance_id,
                "attendance_date": str(payload.attendance_date),
                "student_id": payload.student_id,
                "batch_id": payload.batch_id,
                "status": payload.status,
            },
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Attendance record not found.",
            }

        connection.commit()

        return {
            "success": True,
            "message": "Attendance updated successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.delete("/{attendance_id}")
def delete_attendance(attendance_id: int):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM ATTENDANCE WHERE ATTENDANCE_ID = :id",
            {"id": attendance_id},
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Attendance record not found.",
            }

        connection.commit()

        return {
            "success": True,
            "message": "Attendance deleted successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()
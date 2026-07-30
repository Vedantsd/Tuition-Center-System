from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal
from datetime import date

from db import get_connection

router = APIRouter()


class SubmissionBase(BaseModel):
    assignment_id: int
    student_id: int
    submitted_date: date
    marks: Optional[Decimal] = None

    @field_validator("marks")
    @classmethod
    def validate_marks(cls, value):
        if value is not None and not (0 <= value <= Decimal("999.99")):
            raise ValueError("Marks must be between 0 and 999.99")
        return value


class SubmissionCreate(SubmissionBase):
    submission_id: int


class SubmissionUpdate(SubmissionBase):
    pass


class SubmissionResponse(BaseModel):
    submission_id: int
    assignment_id: int
    student_id: int
    submitted_date: str
    marks: Optional[float] = None


@router.get("/newid")
def get_new_submission_id():
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT NVL(MAX(SUBMISSION_ID), 0) + 1 FROM ASSIGNMENT_SUBMISSION"
        )

        submission_id = cursor.fetchone()[0]

        return {
            "success": True,
            "submission_id": submission_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/")
def get_all_submissions():
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                SUBMISSION_ID,
                ASSIGNMENT_ID,
                STUDENT_ID,
                TO_CHAR(SUBMITTED_DATE, 'YYYY-MM-DD'),
                MARKS
            FROM ASSIGNMENT_SUBMISSION
            ORDER BY SUBMISSION_ID
            """
        )

        rows = cursor.fetchall()

        submissions = []
        for row in rows:
            submissions.append(
                {
                    "submission_id": row[0],
                    "assignment_id": row[1],
                    "student_id": row[2],
                    "submitted_date": row[3],
                    "marks": float(row[4]) if row[4] is not None else None,
                }
            )

        return {
            "success": True,
            "data": submissions,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/{submission_id}")
def get_submission(submission_id: int):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                SUBMISSION_ID,
                ASSIGNMENT_ID,
                STUDENT_ID,
                TO_CHAR(SUBMITTED_DATE, 'YYYY-MM-DD'),
                MARKS
            FROM ASSIGNMENT_SUBMISSION
            WHERE SUBMISSION_ID = :id
            """,
            {"id": submission_id},
        )

        row = cursor.fetchone()

        if row is None:
            return {
                "success": False,
                "message": "Submission not found.",
            }

        return {
            "success": True,
            "data": {
                "submission_id": row[0],
                "assignment_id": row[1],
                "student_id": row[2],
                "submitted_date": row[3],
                "marks": float(row[4]) if row[4] is not None else None,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.post("/")
def create_submission(payload: SubmissionCreate):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO ASSIGNMENT_SUBMISSION
            (
                SUBMISSION_ID,
                ASSIGNMENT_ID,
                STUDENT_ID,
                SUBMITTED_DATE,
                MARKS
            )
            VALUES
            (
                :submission_id,
                :assignment_id,
                :student_id,
                TO_DATE(:submitted_date, 'YYYY-MM-DD'),
                :marks
            )
            """,
            {
                "submission_id": payload.submission_id,
                "assignment_id": payload.assignment_id,
                "student_id": payload.student_id,
                "submitted_date": str(payload.submitted_date),
                "marks": float(payload.marks) if payload.marks is not None else None,
            },
        )

        connection.commit()

        return {
            "success": True,
            "message": "Submission saved successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.put("/{submission_id}")
def update_submission(submission_id: int, payload: SubmissionUpdate):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE ASSIGNMENT_SUBMISSION
            SET
                ASSIGNMENT_ID = :assignment_id,
                STUDENT_ID = :student_id,
                SUBMITTED_DATE = TO_DATE(:submitted_date, 'YYYY-MM-DD'),
                MARKS = :marks
            WHERE SUBMISSION_ID = :submission_id
            """,
            {
                "submission_id": submission_id,
                "assignment_id": payload.assignment_id,
                "student_id": payload.student_id,
                "submitted_date": str(payload.submitted_date),
                "marks": float(payload.marks) if payload.marks is not None else None,
            },
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Submission not found.",
            }

        connection.commit()

        return {
            "success": True,
            "message": "Submission updated successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.delete("/{submission_id}")
def delete_submission(submission_id: int):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM ASSIGNMENT_SUBMISSION WHERE SUBMISSION_ID = :id",
            {"id": submission_id},
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Submission not found.",
            }

        connection.commit()

        return {
            "success": True,
            "message": "Submission deleted successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()
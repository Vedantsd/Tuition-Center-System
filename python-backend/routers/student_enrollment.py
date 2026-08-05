from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date

from db import get_connection

router = APIRouter()


class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int
    batch_id: int
    admission_date: date
    status: str


class EnrollmentCreate(EnrollmentBase):
    enrollment_id: int


class EnrollmentUpdate(EnrollmentBase):
    pass


class EnrollmentResponse(BaseModel):
    enrollment_id: int
    student_id: int
    course_id: int
    batch_id: int
    admission_date: str
    status: str


@router.get("/newid")
def get_new_enrollment_id():
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT NVL(MAX(ENROLLMENT_ID), 0) + 1 FROM STUDENT_ENROLLMENT"
        )

        enrollment_id = cursor.fetchone()[0]

        return {
            "success": True,
            "enrollment_id": enrollment_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.get("/")
def get_all_enrollments():
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                ENROLLMENT_ID,
                STUDENT_ID,
                COURSE_ID,
                BATCH_ID,
                TO_CHAR(ADMISSION_DATE, 'YYYY-MM-DD'),
                STATUS
            FROM STUDENT_ENROLLMENT
            ORDER BY ENROLLMENT_ID
            """
        )

        rows = cursor.fetchall()

        records = []
        for row in rows:
            records.append(
                {
                    "enrollment_id": row[0],
                    "student_id": row[1],
                    "course_id": row[2],
                    "batch_id": row[3],
                    "admission_date": row[4],
                    "status": row[5],
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


@router.get("/{enrollment_id}")
def get_enrollment(enrollment_id: int):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                ENROLLMENT_ID,
                STUDENT_ID,
                COURSE_ID,
                BATCH_ID,
                TO_CHAR(ADMISSION_DATE, 'YYYY-MM-DD'),
                STATUS
            FROM STUDENT_ENROLLMENT
            WHERE ENROLLMENT_ID = :id
            """,
            {"id": enrollment_id},
        )

        row = cursor.fetchone()

        if row is None:
            return {
                "success": False,
                "message": "Enrollment not found.",
            }

        return {
            "success": True,
            "data": {
                "enrollment_id": row[0],
                "student_id": row[1],
                "course_id": row[2],
                "batch_id": row[3],
                "admission_date": row[4],
                "status": row[5],
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.post("/")
def create_enrollment(payload: EnrollmentCreate):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO STUDENT_ENROLLMENT
            (
                ENROLLMENT_ID,
                STUDENT_ID,
                COURSE_ID,
                BATCH_ID,
                ADMISSION_DATE,
                STATUS
            )
            VALUES
            (
                :enrollment_id,
                :student_id,
                :course_id,
                :batch_id,
                TO_DATE(:admission_date, 'YYYY-MM-DD'),
                :status
            )
            """,
            {
                "enrollment_id": payload.enrollment_id,
                "student_id": payload.student_id,
                "course_id": payload.course_id,
                "batch_id": payload.batch_id,
                "admission_date": str(payload.admission_date),
                "status": payload.status,
            },
        )

        connection.commit()

        return {
            "success": True,
            "message": "Enrollment saved successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.put("/{enrollment_id}")
def update_enrollment(enrollment_id: int, payload: EnrollmentUpdate):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE STUDENT_ENROLLMENT
            SET
                STUDENT_ID = :student_id,
                COURSE_ID = :course_id,
                BATCH_ID = :batch_id,
                ADMISSION_DATE = TO_DATE(:admission_date, 'YYYY-MM-DD'),
                STATUS = :status
            WHERE ENROLLMENT_ID = :enrollment_id
            """,
            {
                "enrollment_id": enrollment_id,
                "student_id": payload.student_id,
                "course_id": payload.course_id,
                "batch_id": payload.batch_id,
                "admission_date": str(payload.admission_date),
                "status": payload.status,
            },
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Enrollment not found.",
            }

        connection.commit()

        return {
            "success": True,
            "message": "Enrollment updated successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()


@router.delete("/{enrollment_id}")
def delete_enrollment(enrollment_id: int):
    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM STUDENT_ENROLLMENT WHERE ENROLLMENT_ID = :id",
            {"id": enrollment_id},
        )

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Enrollment not found.",
            }

        connection.commit()

        return {
            "success": True,
            "message": "Enrollment deleted successfully.",
        }

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if connection:
            connection.close()
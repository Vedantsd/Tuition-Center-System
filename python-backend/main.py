from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.assignment_submission import router as submission_router
from routers.audit_log import router as audit_log_router

app = FastAPI(
    title="Tuition Centre System - Python API",
    description="Transaction-layer FastAPI backend (OracleDB)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    submission_router,
    prefix="/submissions",
    tags=["Assignment Submissions"],
)

app.include_router(
    audit_log_router,
    prefix="/audit-logs",
    tags=["Audit Log"],
)


@app.get("/")
def root():
    return {
        "message": "Tuition Centre System - Python API is running."
    }
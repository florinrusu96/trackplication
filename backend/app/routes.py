import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.db import get_db
from app.extraction import extract_application
from app.models import Application
from app.schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    ExtractedApplication,
    ExtractRequest,
)

router = APIRouter(prefix="/api", dependencies=[Depends(require_api_key)])


def _get_or_404(db: Session, app_id: uuid.UUID) -> Application:
    obj = db.get(Application, app_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return obj


@router.post("/extract", response_model=ExtractedApplication)
def extract(payload: ExtractRequest) -> ExtractedApplication:
    """Extract structured fields from raw text. Saves nothing."""
    try:
        return extract_application(payload.text)
    except Exception as exc:  # noqa: BLE001 — surface any Claude/SDK failure as 502
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Extraction failed: {exc}",
        ) from exc


@router.get("/applications", response_model=list[ApplicationOut])
def list_applications(db: Session = Depends(get_db)) -> list[Application]:
    stmt = select(Application).order_by(
        Application.applied_at.desc(), Application.created_at.desc()
    )
    return list(db.scalars(stmt))


@router.post(
    "/applications", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED
)
def create_application(
    payload: ApplicationCreate, db: Session = Depends(get_db)
) -> Application:
    data = payload.model_dump(exclude_none=True)
    obj = Application(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.patch("/applications/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: uuid.UUID, payload: ApplicationUpdate, db: Session = Depends(get_db)
) -> Application:
    obj = _get_or_404(db, app_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(app_id: uuid.UUID, db: Session = Depends(get_db)) -> Response:
    obj = _get_or_404(db, app_id)
    db.delete(obj)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

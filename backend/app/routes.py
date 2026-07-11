import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.extraction import extract_application
from app.models import Application, User
from app.schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    ExtractedApplication,
    ExtractRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.security import create_token, hash_password, verify_password

# --- Auth (unauthenticated except /me) ---------------------------------------

auth_router = APIRouter(prefix="/api/auth")


@auth_router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists",
        ) from None
    db.refresh(user)
    return TokenResponse(token=create_token(str(user.id)), user=UserOut.model_validate(user))


@auth_router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if (
        user is None
        or user.hashed_password is None
        or not verify_password(payload.password, user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return TokenResponse(token=create_token(str(user.id)), user=UserOut.model_validate(user))


@auth_router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)) -> User:
    return current


# --- Applications (all scoped to the current user) ---------------------------

router = APIRouter(prefix="/api", dependencies=[Depends(get_current_user)])


def _get_owned_or_404(db: Session, user: User, app_id: uuid.UUID) -> Application:
    obj = db.get(Application, app_id)
    if obj is None or obj.user_id != user.id:
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
def list_applications(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Application]:
    stmt = (
        select(Application)
        .where(Application.user_id == user.id)
        .order_by(Application.applied_at.desc(), Application.created_at.desc())
    )
    return list(db.scalars(stmt))


@router.post(
    "/applications", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED
)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Application:
    data = payload.model_dump(exclude_none=True)
    obj = Application(**data, user_id=user.id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.patch("/applications/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: uuid.UUID,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Application:
    obj = _get_owned_or_404(db, user, app_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    obj = _get_owned_or_404(db, user, app_id)
    db.delete(obj)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

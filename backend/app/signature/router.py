from datetime import datetime
from fastapi import APIRouter, Depends, Query

from app.signature.dao import SignatureDAO
from app.utils.get_user import get_current_user, get_employee_user
from app.schemas.base import Users
from app.signature.schemas import SAddSignature
from app.signature.service import SignatureService

router = APIRouter(prefix="/api/signature", tags=["API signature"])


@router.get("/")
async def all():
    return {"signature": await SignatureDAO.find_all()}


@router.get("/all")
async def all_signature_api(current_user: Users = Depends(get_employee_user)):
    return await SignatureService.all()


@router.post("/subscribe")
async def create_signature_api(
    signature_data: SAddSignature,
    current_user: Users = Depends(get_employee_user),
):
    return await SignatureService.update_signature(
        users_id=current_user.id, conclusion_id=signature_data.conclusion_id
    )


@router.get("/search/{text}")
async def search_signature_api(
    text: str,
    current_user: Users = Depends(get_employee_user),
):
    return await SignatureService.search_signature(text)


@router.get("/filter")
async def filter_signature_api(
    street: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    current_user: Users = Depends(get_employee_user),
):
    return await SignatureService.filter_signature(street, date_from, date_to)

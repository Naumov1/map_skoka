from datetime import datetime
from fastapi import APIRouter, Depends, Query

from app.utils.get_user import get_current_user
from app.schemas.base import Users
from app.conclusion.schemas import (
    ResponseAllConclusion,
    ResponseConclusion,
    ResponseCountConclusion,
    SCreateConclusion,
)
from app.conclusion.service import ConclusionService
from app.schemas.base import ResponseDetail

router = APIRouter(prefix="/api/conclusion", tags=["API conclusion"])


@router.post("/create", response_model=ResponseDetail)
async def create_conclusions_api(conclusion_data: SCreateConclusion):
    return await ConclusionService.create_conclusions(
        conclusion_data.applications_id,
        conclusion_data.date,
        conclusion_data.chairman,
        conclusion_data.members,
        conclusion_data.justification,
        conclusion_data.documents,
        conclusion_data.conclusion,
    )


@router.get("/all", response_model=ResponseAllConclusion)
async def all_conclusions_api(current_user: Users = Depends(get_current_user)):
    return await ConclusionService.all_conclusions(current_user.id)


@router.get("/detail/{id}", response_model=ResponseConclusion)
async def detail_conclusions_api(id: int):
    return await ConclusionService.detail_conclusions(id)


@router.get("/my", response_model=ResponseCountConclusion)
async def my_conclusions_api(current_user: Users = Depends(get_current_user)):
    return await ConclusionService.my_conclusions(current_user.id)


@router.get("/search/{text}", response_model=ResponseCountConclusion)
async def search_conclusions_api(
    text: str, current_user: Users = Depends(get_current_user)
):
    return await ConclusionService.search_conclusions(text, current_user.id)


@router.get("/filter", response_model=ResponseCountConclusion)
async def filter_conclusions_api(
    street: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    signed: bool | None = Query(None),
    current_user: Users = Depends(get_current_user),
):
    return await ConclusionService.filter_conclusions(
        street, date_from, date_to, signed, current_user.id
    )


@router.get("/download/{id}")
async def download_conclusions_api(id: int):
    return await ConclusionService.download_conclusions(id)


@router.get("/view/{id}")
async def view_conclusions_api(id: int):
    return await ConclusionService.view_conclusions(id)

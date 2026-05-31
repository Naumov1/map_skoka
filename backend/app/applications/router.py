from datetime import datetime
from fastapi import APIRouter, Depends, Query, UploadFile

from app.applications.schemas import (
    ResponseApplication,
    ResponseApplicationDetail,
    ResponseApplications,
    ResponseCommissionAnalysis,
    ResponseCountApplications,
    ResponseDetailApplications,
    ResponseStreetsApplications,
    SApplicationsDeparture,
    SCreateApplications,
)
from app.applications.service import ApplicationsService
from app.utils.get_user import get_admin_user, get_current_user, get_employee_user
from app.schemas.base import Users
from app.schemas.base import ResponseDetail

router = APIRouter(prefix="/api/applications", tags=["API applications"])


@router.get("/", response_model=ResponseApplications)
async def all_api(current_user: Users = Depends(get_admin_user)):
    return await ApplicationsService.all()

@router.get("/my", response_model=ResponseCountApplications)
async def my_applications_api(current_user: Users = Depends(get_current_user)):
    return await ApplicationsService.my_applications(current_user.id)


@router.post("/create", response_model=ResponseDetailApplications)
async def create_applications_api(
    applications_data: SCreateApplications,
    current_user: Users = Depends(get_current_user),
):
    return await ApplicationsService.create_applications(
        current_user.id,
        applications_data.fio,
        applications_data.phone,
        applications_data.email,
        applications_data.cadastral_number,
        applications_data.problem,
        applications_data.address,
    )


@router.patch("/departure", response_model=ResponseDetail)
async def update_departure_api(
    application_data: SApplicationsDeparture,
    current_user: Users = Depends(get_employee_user),
):
    return await ApplicationsService.update_departure(
        application_data.applications_id,
        application_data.departure_date,
    )


@router.delete("/delete/{id}", response_model=ResponseApplicationDetail)
async def delete_applications_api(
    id: int,
    current_user: Users = Depends(get_current_user),
):
    return await ApplicationsService.delete_applications(
        id,
        current_user.id,
        current_user.role,
    )


@router.get("/all", response_model=ResponseCountApplications)
async def all_applications_api(current_user: Users = Depends(get_employee_user)):
    return await ApplicationsService.all_applications()


@router.get("/detail/{id}", response_model=ResponseApplication)
async def detail_applications_api(
    id: int,
    current_user: Users = Depends(get_current_user),
):
    return await ApplicationsService.detail_applications(
        id,
        current_user.id,
        current_user.role,
    )


@router.post("/analyze/{id}", response_model=ResponseCommissionAnalysis)
async def analyze_for_commission_api(
    id: int,
    current_user: Users = Depends(get_employee_user),
):
    return await ApplicationsService.analyze_for_commission(
        id,
        current_user.id,
        current_user.role,
    )


@router.get("/search/{text}", response_model=ResponseCountApplications)
async def search_applications_api(
    text: str,
    current_user: Users = Depends(get_employee_user),
):
    return await ApplicationsService.search_applications(text)


@router.get("/filter", response_model=ResponseCountApplications)
async def filter_applications_api(
    street: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    is_departure: bool | None = Query(None),
    current_user: Users = Depends(get_employee_user),
):
    return await ApplicationsService.filter_applications(
        street, date_from, date_to, is_departure
    )


@router.get("/street", response_model=ResponseStreetsApplications)
async def addres_api(search: str | None = Query(None)):
    return await ApplicationsService.addres_api(search)


@router.get("/download/{id}")
async def download_application_api(
    id: int, current_user: Users = Depends(get_current_user)
):
    return await ApplicationsService.download_applications(
        id,
        current_user.id,
        current_user.role,
    )


@router.get("/view/{id}")
async def view_application_api(
    id: int, current_user: Users = Depends(get_current_user)
):
    return await ApplicationsService.view_applications(
        id,
        current_user.id,
        current_user.role,
    )

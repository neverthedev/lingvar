from fastapi import APIRouter
from .nouns import router as nouns_router

# Main admin router
router = APIRouter(prefix="/admin")

# Include sub-routers
router.include_router(nouns_router)

@router.get("/", tags=["admin"])
async def admin_root():
    """
    Admin root endpoint
    """
    return {"message": "Admin API", "available_endpoints": ["/admin/nouns"]}

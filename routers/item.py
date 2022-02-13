from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field, HttpUrl

router = APIRouter(
    prefix="/item",
    tags=["item"],
    dependencies=[],
    #responses={404: {"description": "Not found"}},
)

class Item (BaseModel):
    id : int = Field(gt=0)
    name : str = Field(min_length=1, max_length=20)
    recent : int = Field(gt=0)
    image : HttpUrl
  
@router.post('/', status_code=status.HTTP_201_CREATED)
async def new_item(item : Item):
    return item


@router.put('/{item_id}', response_model=Item)
async def update_item(item : Item):
    return item
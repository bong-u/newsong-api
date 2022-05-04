from typing import Any, List, Optional

# import peewee
from pydantic import BaseModel
from pydantic.utils import GetterDict

class ItemBase(BaseModel):
    id : int
    name : str
    recent : int
    image : str 
        
class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    owner_id: int

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    items: List[Item] = []

    class Config:
        orm_mode = True

        
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id : int
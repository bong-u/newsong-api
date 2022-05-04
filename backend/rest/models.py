# import peewee
from backend.rest.database import Base

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

class User(Base):
    
    __tablename__ = 'user'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    items = relationship("Item", back_populates="owner")


class Item(Base):
    
    __tablename__ = 'item'
    
    id = Column(Integer, primary_key=True, unique=True, index=True)
    name = Column(String, index=True)
    recent = Column(Integer)
    image = Column(String)
    owner_id = Column(Integer, ForeignKey("user.id"))
    
    owner = relationship("User", back_populates="items")
from contextvars import ContextVar
from decouple import config

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


engine = create_engine (config('DATABASE_URL'))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# import peewee


# DATABASE_NAME = config('DATABASE')
# db_state_default = {"closed": None, "conn": None, "ctx": None, "transactions": None}
# db_state = ContextVar("db_state", default=db_state_default.copy())

# db = peewee.SqliteDatabase(DATABASE_NAME, check_same_thread=False)

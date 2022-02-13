
import uvicorn
from typing import List
import time
from datetime import datetime, timedelta

from jose import JWTError, jwt
from fastapi import Depends, FastAPI, HTTPException, status

from routers import app


app = FastAPI()
app.include_router(auth.router)


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=80)


# database.db.connect()
# database.db.create_tables([models.User, models.Item])
# database.db.close()



# #is it neccessary?
# @app.get("/users/", response_model=List[schemas.User], dependencies=[Depends(get_db)])
# def read_users(skip: int = 0, limit: int = 100):
#     users = crud.get_users(skip=skip, limit=limit)
#     return users


# #need auth
# @app.get("/users/{user_id}", response_model=schemas.User, dependencies=[Depends(get_db)])
# def read_user(user_id: int):
#     db_user = crud.get_user(user_id=user_id)
#     if db_user is None:
#         raise HTTPException(status_code=404, detail="User not found")
#     return db_user



# #need auth
# @app.post(
#     "/users/{user_id}/items/",
#     response_model=schemas.Item,
#     dependencies=[Depends(get_db)],
# )
# def create_item_for_user(user_id: int, item: schemas.ItemCreate):
#     res = crud.create_user_item(item=item, user_id=user_id)
    
#     if not isinstance(res, models.Item):
#         raise HTTPException(status_code=res['code'], detail=res['detail'])
    
#     return res


# @app.get("/items/", response_model=List[schemas.Item], dependencies=[Depends(get_db)])
# def read_items(skip: int = 0, limit: int = 100):
#     items = crud.get_items(skip=skip, limit=limit)
#     return items
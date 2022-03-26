import uvicorn

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from routers import rest

templates = Jinja2Templates(directory='../frontend/public/')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://bongg.run.goorm.io'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.mount('/build', StaticFiles(directory='../frontend/public/build'), name='static')
app.include_router(rest.router)

@app.get('/')
def render(request: Request):
    return templates.TemplateResponse('index.html', {'request': request})

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=80)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.api import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
app.mount("/assets", StaticFiles(directory="frontend/assets"), name="assets")

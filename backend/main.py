from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, rooms, guests, reservations, folios, housekeeping, dashboard, admin

app = FastAPI(title="Hotel PMS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5910"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/v1")
app.include_router(rooms.router,         prefix="/api/v1")
app.include_router(guests.router,        prefix="/api/v1")
app.include_router(reservations.router,  prefix="/api/v1")
app.include_router(folios.router,        prefix="/api/v1")
app.include_router(housekeeping.router,  prefix="/api/v1")
app.include_router(dashboard.router,     prefix="/api/v1")
app.include_router(admin.router,         prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}

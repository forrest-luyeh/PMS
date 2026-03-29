from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, rooms, guests, reservations, folios, housekeeping, dashboard, admin, public, posts, testimonials, hero_slides

app = FastAPI(title="Hotel PMS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5910",   # PMS 管理前端
        "http://localhost:5920",   # CheckInn 公開訂房前端
        "https://book.checkinn.com.tw",  # 未來生產域名
    ],
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
app.include_router(public.router,        prefix="/api/v1")
app.include_router(posts.router,         prefix="/api/v1")
app.include_router(testimonials.router,  prefix="/api/v1")
app.include_router(hero_slides.router,   prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from slowapi.errors import RateLimitExceeded

from database import engine, Base
from limiter import limiter

# Import models before create_all
import models

from routes.auth_routes import router as auth_router
from routes.employee_routes import router as employee_router


app = FastAPI(
    title="Employee Management System",
    description="Employee Management API with JWT Authentication and Role Based Authorization",
    version="1.0.0"
)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Rate Limiter
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_error(
    request: Request,
    exc: RateLimitExceeded
):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Too many requests",
            "message": "Please try again after 1 minute"
        }
    )


# Create Database Tables
Base.metadata.create_all(bind=engine)


# Register Routers
app.include_router(auth_router)
app.include_router(employee_router)


@app.get("/")
def home():

    return {
        "message": "Employee Management API is Running",
        "status": "Success"
    }
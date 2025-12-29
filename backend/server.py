from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import base64
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 168  # 7 days

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Define Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: datetime

class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    analysis_date: datetime
    muscle_groups: dict
    weak_areas: List[str]
    recommendations: List[str]
    progress_score: Optional[float] = None
    image_base64: Optional[str] = None

class ProgressStats(BaseModel):
    total_analyses: int
    current_streak: int
    improvement_percentage: float
    muscle_development: dict

# Helper Functions
def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def analyze_body_image(image_base64: str) -> dict:
    """Analyze body image using Gemini 3 Flash with vision"""
    try:
        # Create a new LlmChat instance for each analysis
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert fitness and body composition analyzer. Analyze body photos to identify muscle groups, assess development, and provide specific recommendations."
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        
        # Create image content
        image_content = ImageContent(image_base64=image_base64)
        
        # Create analysis prompt
        prompt = """Analyze this body photo and provide a detailed assessment in JSON format:
{
  "muscle_groups": {
    "chest": "weak/moderate/strong",
    "shoulders": "weak/moderate/strong",
    "arms": "weak/moderate/strong",
    "back": "weak/moderate/strong",
    "core": "weak/moderate/strong",
    "legs": "weak/moderate/strong"
  },
  "weak_areas": ["list of specific weak muscle groups"],
  "recommendations": [
    "Specific exercise recommendation 1 with sets/reps",
    "Specific exercise recommendation 2 with sets/reps",
    "Specific exercise recommendation 3 with sets/reps",
    "Nutrition tip",
    "Recovery tip"
  ],
  "overall_assessment": "Brief overall assessment of physique"
}

Provide practical, specific recommendations based on the visible muscle development."""
        
        # Send message with image
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        # Extract JSON from response (handling potential markdown formatting)
        response_text = response.strip()
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]
        
        analysis_data = json.loads(response_text.strip())
        return analysis_data
        
    except Exception as e:
        logging.error(f"Error analyzing image: {str(e)}")
        # Return default analysis if AI fails
        return {
            "muscle_groups": {
                "chest": "moderate",
                "shoulders": "moderate",
                "arms": "moderate",
                "back": "moderate",
                "core": "moderate",
                "legs": "moderate"
            },
            "weak_areas": ["Unable to analyze - please try again"],
            "recommendations": [
                "Focus on compound movements",
                "Maintain consistent training schedule",
                "Ensure adequate protein intake",
                "Get 7-9 hours of sleep",
                "Stay hydrated"
            ],
            "overall_assessment": "Analysis unavailable - please upload a clear, well-lit photo"
        }

# Auth Endpoints
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hashed_password.decode('utf-8'),
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Generate token
    token = create_token(user_id)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token
    token = create_token(user['id'])
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name']
        }
    }

@api_router.get("/auth/me")
async def get_current_user(user_id: str = Depends(verify_token)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Analysis Endpoints
@api_router.post("/analysis/upload")
async def upload_analysis(file: UploadFile = File(...), user_id: str = Depends(verify_token)):
    try:
        # Read and validate image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (max 1920x1920)
        max_size = 1920
        if image.width > max_size or image.height > max_size:
            image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        # Analyze image
        analysis_data = await analyze_body_image(image_base64)
        
        # Create analysis record
        analysis_id = str(uuid.uuid4())
        analysis_date = datetime.now(timezone.utc)
        analysis_doc = {
            "id": analysis_id,
            "user_id": user_id,
            "analysis_date": analysis_date.isoformat(),
            "muscle_groups": analysis_data.get('muscle_groups', {}),
            "weak_areas": analysis_data.get('weak_areas', []),
            "recommendations": analysis_data.get('recommendations', []),
            "overall_assessment": analysis_data.get('overall_assessment', ''),
            "image_base64": image_base64,
            "progress_score": calculate_progress_score(analysis_data.get('muscle_groups', {}))
        }
        
        # Insert without _id field
        result = await db.analyses.insert_one(analysis_doc)
        
        # Return response without MongoDB _id and without image to reduce payload
        return {
            "id": analysis_id,
            "user_id": user_id,
            "analysis_date": analysis_date,
            "muscle_groups": analysis_doc["muscle_groups"],
            "weak_areas": analysis_doc["weak_areas"],
            "recommendations": analysis_doc["recommendations"],
            "overall_assessment": analysis_doc["overall_assessment"],
            "progress_score": analysis_doc["progress_score"]
        }
        
    except Exception as e:
        logging.error(f"Error processing upload: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

def calculate_progress_score(muscle_groups: dict) -> float:
    """Calculate overall progress score from muscle group assessments"""
    score_map = {"weak": 33, "moderate": 66, "strong": 100}
    scores = [score_map.get(level, 50) for level in muscle_groups.values()]
    return sum(scores) / len(scores) if scores else 50.0

@api_router.get("/analysis/history")
async def get_analysis_history(user_id: str = Depends(verify_token)):
    analyses = await db.analyses.find(
        {"user_id": user_id},
        {"_id": 0, "image_base64": 0}
    ).sort("analysis_date", -1).to_list(100)
    
    # Convert ISO strings to datetime for response
    for analysis in analyses:
        if isinstance(analysis.get('analysis_date'), str):
            analysis['analysis_date'] = datetime.fromisoformat(analysis['analysis_date'])
    
    return analyses

@api_router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str, user_id: str = Depends(verify_token)):
    analysis = await db.analyses.find_one(
        {"id": analysis_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Convert ISO string to datetime
    if isinstance(analysis.get('analysis_date'), str):
        analysis['analysis_date'] = datetime.fromisoformat(analysis['analysis_date'])
    
    return analysis

@api_router.get("/progress/stats")
async def get_progress_stats(user_id: str = Depends(verify_token)):
    analyses = await db.analyses.find(
        {"user_id": user_id},
        {"_id": 0, "analysis_date": 1, "progress_score": 1, "muscle_groups": 1}
    ).sort("analysis_date", 1).to_list(1000)
    
    if not analyses:
        return {
            "total_analyses": 0,
            "current_streak": 0,
            "improvement_percentage": 0.0,
            "muscle_development": {}
        }
    
    # Calculate stats
    total_analyses = len(analyses)
    
    # Calculate streak
    current_streak = calculate_streak(analyses)
    
    # Calculate improvement
    if len(analyses) >= 2:
        first_score = analyses[0].get('progress_score', 50)
        last_score = analyses[-1].get('progress_score', 50)
        improvement = ((last_score - first_score) / first_score) * 100 if first_score > 0 else 0
    else:
        improvement = 0.0
    
    # Get muscle development trend
    muscle_dev = {}
    if analyses:
        latest_groups = analyses[-1].get('muscle_groups', {})
        for muscle, level in latest_groups.items():
            muscle_dev[muscle] = level
    
    return {
        "total_analyses": total_analyses,
        "current_streak": current_streak,
        "improvement_percentage": round(improvement, 1),
        "muscle_development": muscle_dev
    }

def calculate_streak(analyses: List[dict]) -> int:
    """Calculate current streak of consecutive days"""
    if not analyses:
        return 0
    
    streak = 1
    for i in range(len(analyses) - 1, 0, -1):
        current_date = datetime.fromisoformat(analyses[i]['analysis_date'])
        prev_date = datetime.fromisoformat(analyses[i-1]['analysis_date'])
        diff = (current_date - prev_date).days
        
        if diff <= 1:
            streak += 1
        else:
            break
    
    return streak

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
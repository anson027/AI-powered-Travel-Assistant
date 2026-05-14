from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama 
import re
app=FastAPI()

sessions={}
app.add_middleware(
  CORSMiddleware,
  allow_origins=['*'],
  allow_methods=['*'],
  allow_headers=['*'],
)

class ChatRequest(BaseModel):
  session_id:str
  message:str


@app.post('/')
async def chat_endpoint(request:ChatRequest):
  user_id=request.session_id
  user_text=request.message
  if user_id not in sessions:
    sessions[user_id]=[
      {
        "role": "system",
        "content": """You are the 'Travel AI Explorer' Lead Planner.
        INSTRUCTIONS:
        - List options using numbered format: 1) , 2) , etc.
        - Each item must be on a SINGLE LINE in this format: Name, Price, Rating.
        - Do not include any introductory or concluding text."""
      }
    ]
  sessions[user_id].append({'role': 'user', 'content': user_text})
  
  response=ollama.chat(
    model='llama3.2:1b',
    messages=sessions[user_id],
    stream=False,
    options={'temperature':0}
    )
  
  model_reply=response['message']['content']
  sessions[user_id].append({'role':'assistant','content':model_reply})
  
  clean_text=re.sub(r'[*]','',model_reply)

  raw_items=clean_text.split('\n')

  final_list=[item.split(', ') for item in raw_items]
  print("Final list:",final_list)
  
  return {'reply': final_list}
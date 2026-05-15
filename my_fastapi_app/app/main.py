# Hai
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
  user_id=0
  user_text=request.message
  if user_id not in sessions:
    sessions[user_id]=[
      {
        "role": "system",
        "content": "You are the Travel AI. List options as: Name, Price, Rating. No extra text."
      }
    ]
  sessions[user_id].append({'role': 'user', 'content': user_text})
  
  response=ollama.chat(
    model='llama3.2:3b',
    messages=sessions[user_id],
    stream=False,
    options={'temperature':0}
    )
  
  model_reply=response['message']['content']
  sessions[user_id].append({'role':'assistant','content':model_reply})
  
  final_list=[]
  lines=re.sub(r'[*]','',model_reply).strip().split('\n')

  for line in lines:
    clean_line=re.sub(r'^\d+[\).]\s*', '', line).strip()
    if clean_line:
      parts=[p.strip() for p in clean_line.split(', ')]
      if len(parts)>=2:
        final_list.append(parts)
  return {'reply': final_list}
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "vulx-scan-engine"}

@app.get("/")
def read_root():
    return {"message": "VULX Scan Engine Ready"}

FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render mentioned port 5016
EXPOSE 5016

CMD ["python", "run_prod.py"]

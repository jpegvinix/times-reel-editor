# Cloud Run Render Service

## Variavel do frontend

Adicione na Vercel:

- `VITE_RENDER_API_URL=https://SEU_SERVICO.run.app`

## Deploy

```bash
gcloud builds submit --tag gcr.io/SEU_PROJETO/times-render -f Dockerfile

gcloud run deploy times-render \
  --image gcr.io/SEU_PROJETO/times-render \
  --platform managed \
  --region us-east1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900
```

## Endpoints

- `GET /health`
- `POST /render`

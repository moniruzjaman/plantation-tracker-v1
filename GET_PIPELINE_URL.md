# 🔗 How to Get VITE_GEE_PIPELINE_URL

Your `VITE_GEE_PIPELINE_URL` is the **public HTTPS endpoint** of your deployed Google Earth Engine Cloud Function.

---

## 🛠️ Step-by-Step Deployment

### Step 1: Prerequisites

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Login
gcloud auth login

# Set project (replace with your GCP project ID)
gcloud config set project YOUR_GCP_PROJECT_ID

# Enable APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable earthengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Step 2: Prepare Backend Files

From your repo:

```bash
cd backend/

# Create requirements.txt
cat > requirements.txt << 'EOF'
functions-framework==3.*
earthengine-api>=0.1.374
flask>=2.3.0
google-cloud-logging>=3.8.0
EOF

# Verify main.py exists
ls -la main.py
```

### Step 3: Deploy Cloud Function

```bash
# Deploy HTTP-triggered function
gcloud functions deploy run_ndvi_pipeline \
  --gen2 \
  --runtime=python311 \
  --region=asia-south1 \
  --source=. \
  --entry-point=main \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=120s \
  --max-instances=10 \
  --service-account=YOUR-SA@YOUR-PROJECT.iam.gserviceaccount.com
```

> **Note:** `--allow-unauthenticated` makes it public. For production, use IAM authentication.

### Step 4: Get the URL

After deployment, you'll see:

```
✓ Deploying function...
✓ Function run_ndvi_pipeline deployed
  URL: https://asia-south1-YOUR-PROJECT.cloudfunctions.net/run_ndvi_pipeline
```

**This URL is your `VITE_GEE_PIPELINE_URL`**

---

## 🔧 Alternative: Get URL for Existing Function

```bash
# List all functions
gcloud functions list

# Get specific function URL
gcloud functions describe run_ndvi_pipeline --gen2 --region=asia-south1 --format="value(serviceConfig.uri)"
```

---

## 📋 Add to Your Project

### 1. Local Development

Create `.env.local` in your project root:

```bash
VITE_GEE_PIPELINE_URL=https://asia-south1-YOUR-PROJECT.cloudfunctions.net/run_ndvi_pipeline
VITE_SENTINEL_HUB_INSTANCE_ID=your-sh-instance-id  # optional
```

### 2. Vercel Dashboard (Production)

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_GEE_PIPELINE_URL` | `https://asia-south1-YOUR-PROJECT.cloudfunctions.net/run_ndvi_pipeline` |

### 3. GitHub Secrets (CI/CD)

Go to **GitHub Repo → Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `VITE_GEE_PIPELINE_URL` | Your Cloud Function URL |

---

## 🌍 Regional Endpoints Reference

| Region | URL Pattern |
|--------|-------------|
| `asia-south1` (Mumbai) | `https://asia-south1-PROJECT.cloudfunctions.net/FUNCTION` |
| `asia-southeast1` (Singapore) | `https://asia-southeast1-PROJECT.cloudfunctions.net/FUNCTION` |
| `us-central1` (Iowa) | `https://us-central1-PROJECT.cloudfunctions.net/FUNCTION` |
| `europe-west1` (Belgium) | `https://europe-west1-PROJECT.cloudfunctions.net/FUNCTION` |

**For Bangladesh users:** Use `asia-south1` (Mumbai) for lowest latency (~30-50ms).

---

## 🔐 Security Best Practices

### Option A: Public Function (Demo/Small Team)
```bash
--allow-unauthenticated  # Anyone can call it
```

### Option B: IAM-Protected (Production)
```bash
# Remove --allow-unauthenticated
gcloud functions deploy run_ndpi_pipeline --gen2 ...

# Allow only your Vercel app
gcloud functions add-iam-policy-binding run_ndvi_pipeline \
  --region=asia-south1 \
  --member="serviceAccount:YOUR-VERCEL-SA@YOUR-PROJECT.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.invoker"
```

### Option C: API Key Gateway
```bash
# Deploy behind Cloud Endpoints or API Gateway for rate limiting & monitoring
```

---

## ✅ Verification

Test your endpoint:

```bash
curl -X POST https://asia-south1-YOUR-PROJECT.cloudfunctions.net/run_ndvi_pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "bounds": [[25.7, 89.5], [25.9, 89.7]],
    "date_from": "2024-01-01",
    "date_to": "2024-01-31",
    "indices": ["NDVI", "EVI"]
  }'
```

Expected response:
```json
{
  "ndvi_mean": 0.452,
  "evi_mean": 0.381,
  "area_ha": 124.5,
  "healthy_pct": 38.0,
  "stress_pct": 22.0,
  "bare_pct": 40.0
}
```

---

## 💰 Cost Estimate

| Tier | Requests/Month | Cost |
|------|---------------|------|
| Free | 2 million | $0 |
| Standard | 10 million | ~$5-10 |
| EEE processing | Per GB-sec | ~$0.0000025/GB-sec |

**For 100 field officers, 10 requests/day each:** ~30,000 requests/month = **Free tier**

---

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| `403 Forbidden` | Check IAM permissions or `--allow-unauthenticated` |
| `404 Not Found` | Function not deployed or wrong region |
| `500 Internal Error` | Check Cloud Function logs: `gcloud functions logs read run_ndvi_pipeline` |
| `EE initialization failed` | Service account lacks Earth Engine access |
| CORS errors | Ensure `Access-Control-Allow-Origin: *` header in response |

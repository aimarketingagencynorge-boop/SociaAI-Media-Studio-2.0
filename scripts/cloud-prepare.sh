#!/usr/bin/env bash
set -euo pipefail
PROJECT=gen-lang-client-0893574157
DATABASE=ai-studio-da2c7ce8-8cbd-4a4d-a1f0-c740600206e8
SERVICE=sociai-studio-app
REGION=us-west1
ACCOUNT=sociai-studio-runtime@$PROJECT.iam.gserviceaccount.com
BUCKET=$PROJECT-sociai-media
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com firebasestorage.googleapis.com --project="$PROJECT" --quiet
if ! gcloud iam service-accounts describe "$ACCOUNT" --project="$PROJECT" >/dev/null 2>&1; then
  gcloud iam service-accounts create sociai-studio-runtime --display-name='SociAI Studio runtime' --project="$PROJECT" --quiet
fi
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$ACCOUNT" --role=roles/datastore.user --condition="expression=resource.name=='projects/$PROJECT/databases/$DATABASE',title=sociai_database_only" --quiet >/dev/null
if ! gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET" --project="$PROJECT" --location="$REGION" --uniform-bucket-level-access --quiet
fi
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member="serviceAccount:$ACCOUNT" --role=roles/storage.objectAdmin --quiet >/dev/null
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member="serviceAccount:$ACCOUNT" --role=roles/storage.legacyBucketReader --quiet >/dev/null
gcloud run deploy "$SERVICE" --source=. --project="$PROJECT" --region="$REGION" --service-account="$ACCOUNT" --no-allow-unauthenticated --min-instances=0 --max-instances=1 --concurrency=10 --cpu=1 --memory=1Gi --timeout=600 --port=8080 --set-env-vars="FIREBASE_PROJECT_ID=$PROJECT,FIRESTORE_DATABASE_ID=$DATABASE,FIREBASE_STORAGE_BUCKET=$BUCKET,STARTER_DAILY_LIMIT=25" --quiet
gcloud run services describe "$SERVICE" --project="$PROJECT" --region="$REGION" --format='value(status.url)'

#!/bin/bash
# Frontend startup script with environment variables

export NEXT_PUBLIC_SUPABASE_URL="https://dngnmalbjapetqdafhvg.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZ25tYWxiamFwZXRxZGFmaHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjk5ODEsImV4cCI6MjA4Mjc0NTk4MX0.qyQhCYF04B0IgEtInvn-owSlk51hDt2ALeXMnSzbimk"
export NEXT_PUBLIC_API_URL="http://localhost:8000/api"

cd /Users/nick/Desktop/code-story-platform
pnpm dev

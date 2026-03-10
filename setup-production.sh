#!/bin/bash

echo "🚀 SafeHelpHub Production Setup Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate random secret
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

echo -e "${BLUE}Step 1: Generate JWT Secrets${NC}"
JWT_SECRET=$(generate_secret)
JWT_KEY=$(generate_secret)
echo "✓ JWT secrets generated"
echo ""

echo -e "${BLUE}Step 2: Service Setup Instructions${NC}"
echo ""

echo -e "${YELLOW}1. SUPABASE (Database + Storage)${NC}"
echo "   → Go to: https://supabase.com/dashboard"
echo "   → Create new project: 'safehelpub-db'"
echo "   → Copy connection string from Settings > Database"
echo ""

echo -e "${YELLOW}2. RESEND (Email Service)${NC}"
echo "   → Go to: https://resend.com/signup"
echo "   → Create API key: 'safehelpub-production'"
echo "   → Copy the API key (starts with 're_')"
echo ""

echo -e "${YELLOW}3. OPENAI (AI Chatbot)${NC}"
echo "   → Go to: https://platform.openai.com/api-keys"
echo "   → Create new API key"
echo "   → Copy the key (starts with 'sk-')"
echo ""

echo -e "${BLUE}Step 3: Update .env file${NC}"
cat > .env.production << EOF
# Generated JWT Secrets
JWT_SECRET=${JWT_SECRET}
JWT_KEY=${JWT_KEY}
SALT=10

# Database (Supabase) - UPDATE THIS
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Email (Resend) - UPDATE THIS
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=onboarding@resend.dev

# OpenAI - UPDATE THIS
OPENAI_API_KEY=sk_your_key_here

# Supabase - UPDATE THIS
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_KEY=your_supabase_anon_key

# App Config
NODE_ENV=production
PORT=3000
EOF

echo "✓ Created .env.production file"
echo ""

echo -e "${GREEN}Generated Secrets:${NC}"
echo "JWT_SECRET=${JWT_SECRET}"
echo "JWT_KEY=${JWT_KEY}"
echo ""

echo -e "${BLUE}Step 4: Deploy Backend to Render${NC}"
echo "   → Go to: https://render.com"
echo "   → New Web Service > Connect GitHub repo: SafeHelpHub"
echo "   → Use these settings:"
echo "     - Build Command: npm install && npm run build"
echo "     - Start Command: npm run start:prod"
echo "     - Add environment variables from .env.production"
echo ""

echo -e "${BLUE}Step 5: Deploy Frontend to Vercel${NC}"
echo "   → Go to: https://vercel.com"
echo "   → Import GitHub repo: silent-report-app"
echo "   → Add environment variable:"
echo "     VITE_API_URL=https://safehelpub-api.onrender.com"
echo ""

echo -e "${GREEN}✓ Setup script complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Complete service signups (Supabase, Resend, OpenAI)"
echo "2. Update .env.production with real credentials"
echo "3. Deploy to Render and Vercel"
echo "4. Test the application"
echo ""
echo "For detailed instructions, see: DEPLOYMENT_GUIDE.md"

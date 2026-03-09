# SafeVoice - AI-Powered Anonymous Reporting Platform

## Overview

SafeVoice is a secure, anonymous platform for reporting sensitive incidents like FGM (Female Genital Mutilation) and domestic violence. The platform leverages **AI and machine learning** to provide intelligent incident classification, real-time support through an AI chatbot, and geolocation-based NGO matching.

## 🚀 Key Features

### 1. **AI-Powered Chatbot (OpenAI GPT-4)**
- 24/7 real-time support for victims
- Compassionate, trauma-informed responses
- Guidance on reporting procedures
- Resource recommendations (shelters, legal aid, medical services)
- Crisis intervention support

**Endpoint:** `POST /questions/chatbot/ask`

```json
{
  "message": "I need help reporting domestic violence"
}
```

**Response:**
```json
{
  "response": "I understand you need help. Here are the steps you can take..."
}
```

### 2. **AI Incident Analysis & Classification**
Automatically analyzes incident reports using NLP to:
- **Classify urgency** (urgent/moderate/low)
- **Extract entities** (location, incident type, timeframe)
- **Categorize incidents** (domestic violence, FGM, harassment, etc.)
- **Recommend actions** based on incident severity

**Implementation:** Integrated into incident creation flow

```typescript
// AI Analysis performed on every report submission
const aiAnalysis = await aiChatbotService.analyzeIncidentUrgency(description);

// Returns:
{
  urgency: 'urgent' | 'moderate' | 'low',
  classification: 'domestic violence' | 'FGM' | 'harassment',
  extractedEntities: {
    location: 'Lagos, Nigeria',
    incidentType: 'physical abuse',
    timeframe: 'ongoing'
  },
  recommendedActions: [
    'Contact local authorities immediately',
    'Seek medical attention',
    'Document evidence'
  ]
}
```

### 3. **Anonymous Reporting**
- No personal information required
- Secure file uploads (images, documents)
- Encrypted data storage
- Privacy-first architecture

**Endpoint:** `POST /reports/create`

### 4. **Geolocation-Based NGO Matching**
- Automatically maps incidents to nearby NGOs
- Filters by incident type and location
- Real-time NGO availability
- Contact information provided

### 5. **SOS Emergency Alerts**
- One-tap emergency activation
- Automatic geolocation sharing
- Alerts emergency services
- Incident logging for follow-up

**Endpoint:** `POST /sos/alert`

## 🏗️ Technical Architecture

### Microservice Design

```
Mobile App
    ↓
NestJS API (Core Service)
    ↓
├── Report Management
├── User Authentication
├── NGO Management
└── AI Services
        ↓
    OpenAI GPT-4
```

### Technology Stack

**Backend:**
- **NestJS** (Node.js/TypeScript) - Core API framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **OpenAI API** - AI/ML processing
- **AWS S3** - File storage
- **JWT** - Authentication

**AI/ML:**
- **OpenAI GPT-4** - Chatbot and NLP
- **Natural Language Processing** - Entity extraction
- **Classification Models** - Urgency assessment
- **Sentiment Analysis** - Incident severity

**Security:**
- **HTTPS** - Encrypted communication
- **JWT** - Secure authentication
- **bcrypt** - Password hashing
- **Data encryption** - At rest and in transit

## 📋 API Endpoints

### Chatbot

#### Ask AI Chatbot
```http
POST /questions/chatbot/ask
Content-Type: application/json

{
  "message": "How do I report domestic violence safely?"
}
```

**Response:**
```json
{
  "response": "I understand you need help reporting domestic violence safely. Here are the steps..."
}
```

### Reports

#### Create Incident Report (with AI Analysis)
```http
POST /reports/create
Content-Type: multipart/form-data

{
  "incident_type": "domestic_violence",
  "description": "Detailed description of incident",
  "location": "Lagos, Nigeria",
  "files": [file1, file2]
}
```

**Response:**
```json
{
  "id": "report_id",
  "status": "pending",
  "ai_analysis": {
    "urgency": "urgent",
    "classification": "domestic violence",
    "extracted_entities": {
      "location": "Lagos, Nigeria",
      "incidentType": "physical abuse",
      "timeframe": "recent"
    },
    "recommended_actions": [
      "Contact local authorities immediately",
      "Seek medical attention",
      "Document evidence"
    ],
    "analyzed_at": "2026-03-09T03:00:00Z"
  }
}
```

#### Get Report Status
```http
GET /reports/:id
```

#### Update Report (NGO Action)
```http
PATCH /reports/:id
Content-Type: application/json

{
  "status": "accepted",
  "ngoId": "ngo_id"
}
```

### NGO Management

#### Get Nearby NGOs
```http
GET /ngo/nearby?lat=6.5244&lng=3.3792&radius=10
```

#### Create NGO
```http
POST /ngo/create
Content-Type: application/json

{
  "name": "Support Organization",
  "location": "Lagos, Nigeria",
  "services": ["shelter", "legal_aid", "counseling"],
  "contact": "+234..."
}
```

### SOS Alerts

#### Trigger SOS Alert
```http
POST /sos/alert
Content-Type: application/json

{
  "latitude": 6.5244,
  "longitude": 3.3792,
  "message": "Emergency assistance needed"
}
```

## 🔒 Security & Privacy

### Data Protection
- **End-to-end encryption** for all communications
- **Anonymous reporting** - No PII required
- **Secure file storage** - AWS S3 with encryption
- **HTTPS only** - All API calls encrypted

### Authentication
- **JWT tokens** - Secure API access
- **Optional user accounts** - For tracking own reports
- **Role-based access** - NGO, Admin, User roles

### Compliance
- **GDPR compliant** - Data privacy regulations
- **Audit trails** - Secure logging
- **Data retention policies** - Automatic deletion
- **Right to be forgotten** - User data deletion

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- OpenAI API Key
- AWS S3 credentials

### Installation

```bash
# Clone repository
git clone https://github.com/deejaycodes/SafeHelpHub.git
cd SafeHelpHub

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add your OPENAI_API_KEY, MongoDB URI, AWS credentials

# Run development server
npm run start:dev
```

### Environment Variables

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Database
MONGODB_URI=mongodb://localhost:27017/safehelpub

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET=your_bucket_name

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d

# App
PORT=3000
NODE_ENV=development
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 AI Features Implementation

### 1. AI Chatbot Service (`ai-chatbot.service.ts`)

```typescript
@Injectable()
export class AIChatbotService {
  async generateResponse(userMessage: string): Promise<string> {
    // OpenAI GPT-4 integration
    // Compassionate, trauma-informed responses
    // Crisis intervention support
  }

  async analyzeIncidentUrgency(incidentText: string): Promise<AnalysisResult> {
    // NLP analysis
    // Entity extraction
    // Urgency classification
    // Recommended actions
  }
}
```

### 2. Report Analysis Integration

Every incident report is automatically analyzed:
- **Urgency detection** - Prioritizes critical cases
- **Entity extraction** - Identifies key information
- **Classification** - Categories incident type
- **Action recommendations** - Suggests next steps

### 3. Geolocation NGO Matching

```typescript
// Finds NGOs within radius
// Filters by incident type
// Returns contact information
// Real-time availability
```

## 🌍 Social Impact

### Problem Addressed
- **FGM cases** often unreported due to cultural stigma
- **Domestic violence** victims lack safe reporting channels
- **Harassment** incidents go undocumented
- **Support services** difficult to find

### Solution Impact
- **Safe reporting** - Anonymous, no fear of retaliation
- **Immediate support** - 24/7 AI chatbot assistance
- **Connected to help** - Automatic NGO mapping
- **Data for advocacy** - Anonymous analytics for policy work
- **Reduced barriers** - Easy mobile access

## 📈 Future Enhancements

- [ ] Multi-language support (Yoruba, Igbo, Hausa)
- [ ] Voice-based reporting
- [ ] Integration with emergency services (911, etc.)
- [ ] Admin dashboard for NGOs
- [ ] Analytics for policy makers
- [ ] Expansion to other African countries
- [ ] iOS and Android mobile apps
- [ ] WhatsApp bot integration

## 👥 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

**Project Lead:** Deji Odetayo  
**Email:** dejiodetayo@gmail.com  
**GitHub:** [@deejaycodes](https://github.com/deejaycodes)

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Ireoluwa Foundation for Youth, Children, and Women Development
- All NGOs and support organizations fighting against FGM and domestic violence

---

**Built with ❤️ to make a difference**

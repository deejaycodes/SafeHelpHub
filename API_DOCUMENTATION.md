# SafeHelpHub API Documentation

## Base URL
- **Production**: `https://safehelpub-api.onrender.com`
- **Local**: `http://localhost:3000`

## Interactive Documentation
- **Swagger UI**: `https://safehelpub-api.onrender.com/support`
- **OpenAPI JSON**: `https://safehelpub-api.onrender.com/support-json`

---

## Authentication

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "username": "johndoe",
  "role": "user"
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful. Please verify your email."
}
```

---

### Login
**POST** `/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

## Reports

### Create Report
**POST** `/reports`

Submit an incident report (anonymous or authenticated).

**Headers:**
```
Authorization: Bearer <token> (optional for anonymous)
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
incident_type: "Physical Abuse"
description: "Detailed description of incident"
location: "Lagos"
contact_info: "user@example.com" (optional)
files: [file1.jpg, file2.pdf] (optional, max 2 files)
```

**Response:** `201 Created`
```json
{
  "id": "report-uuid",
  "incident_type": "Physical Abuse",
  "description": "...",
  "location": "Lagos",
  "status": "SUBMITTED",
  "ai_analysis": {
    "urgency": "high",
    "classification": "Domestic Violence",
    "immediate_danger": true,
    "medical_attention_needed": true,
    "police_involvement_recommended": true,
    "recommended_ngo_types": ["medical", "legal", "shelter"],
    "recommended_actions": [
      "Provide safe shelter",
      "Medical assessment",
      "Document injuries"
    ],
    "psychological_state": "Victim likely experiencing significant distress...",
    "action_plan": [
      "Ensure victim safety",
      "Arrange medical examination",
      "File police report",
      "Assign to appropriate NGO",
      "Provide trauma counseling"
    ]
  },
  "created_at": "2026-03-11T06:00:00Z"
}
```

---

### Get All Reports
**GET** `/reports`

Retrieve all reports (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "incident_type": "Physical Abuse",
    "location": "Lagos",
    "status": "SUBMITTED",
    "created_at": "2026-03-11T06:00:00Z"
  }
]
```

---

### Get Single Report
**GET** `/reports/:reportId`

Get detailed information about a specific report.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "incident_type": "Physical Abuse",
  "description": "...",
  "location": "Lagos",
  "status": "SUBMITTED",
  "ai_analysis": { ... },
  "files": [
    {
      "file_path": "https://...",
      "uploaded_at": "2026-03-11T06:00:00Z"
    }
  ],
  "created_at": "2026-03-11T06:00:00Z"
}
```

---

### Update Report Status
**PATCH** `/reports/:reportId`

Update report status (NGO only).

**Request Body:**
```json
{
  "status": "ACCEPTED",
  "rejection_reason": "Optional reason if rejecting"
}
```

**Response:** `200 OK`

---

### Search Reports
**GET** `/reports/search?query=Lagos`

Search reports by location or incident type (NGO only).

**Query Parameters:**
- `query`: Search term

---

## NGO Management

### Register NGO
**POST** `/ngo/register`

Register a new NGO organization.

**Request Body:**
```json
{
  "ngo_name": "Safe Haven Foundation",
  "password": "SecurePass@123",
  "role": "ngo",
  "primary_contact": {
    "name": "John Doe",
    "email": "contact@safehaven.org",
    "phone": "+2348012345678"
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "email": "contact@safehaven.org",
      "name": "John Doe"
    }
  }
}
```

---

### Search NGOs
**GET** `/ngo/search?state=Lagos&name=Safe`

Search for NGOs by location or name.

**Query Parameters:**
- `state`: Nigerian state (optional)
- `name`: NGO name (optional)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "ngo_name": "Safe Haven Foundation",
    "primary_location": {
      "state": "Lagos",
      "city": "Ikeja"
    },
    "contact_info": {
      "primary_contact": {
        "name": "John Doe",
        "email": "contact@safehaven.org",
        "phone": "+2348012345678"
      }
    },
    "services_provided": ["shelter", "counseling", "legal aid"],
    "onBoard": true
  }
]
```

---

### Onboard NGO
**PUT** `/ngo/onboard`

Complete NGO profile setup.

**Request Body:**
```json
{
  "registration_number": "RC123456",
  "primary_location": {
    "state": "Lagos",
    "city": "Ikeja",
    "address": "123 Main Street"
  },
  "incident_types_supported": ["FGM", "Domestic Violence"],
  "services_provided": ["shelter", "counseling", "legal aid"]
}
```

---

### Update NGO Profile
**PUT** `/ngo/update-ngo`

Update NGO information.

---

### Delete NGO
**DELETE** `/ngo`

Delete NGO account.

---

### Resend Verification Code
**POST** `/ngo/resend-code`

Resend email verification code.

**Request Body:**
```json
{
  "email": "ngo@example.com"
}
```

---

## Users

### Verify Email
**POST** `/users/verify`

Verify user email with code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

---

### Forgot Password
**POST** `/users/forgot-password`

Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### Reset Password
**POST** `/users/reset-password`

Reset password with code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecure@123"
}
```

---

### Upload Profile Picture
**PUT** `/users/profile_picture`

Upload user profile picture.

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (Form Data):**
```
file: image.jpg
```

---

### Upload File
**PUT** `/users/file`

Upload additional files.

---

## Incident Types

### Create Incident Type
**POST** `/incident-types`

Create a new incident category.

**Request Body:**
```json
{
  "name": "Physical Abuse"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Physical Abuse",
  "created_at": "2026-03-11T06:00:00Z",
  "updated_at": "2026-03-11T06:00:00Z"
}
```

---

### Get All Incident Types
**GET** `/incident-types`

Retrieve all incident categories.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Physical Abuse",
    "created_at": "2026-03-11T06:00:00Z"
  },
  {
    "id": "uuid",
    "name": "Female Genital Mutilation",
    "created_at": "2026-03-11T06:00:00Z"
  }
]
```

---

### Get Single Incident Type
**GET** `/incident-types/:id`

Get details of a specific incident type.

---

## Notifications

### Get NGO Notifications
**GET** `/notifications/:ngoId`

Get all notifications for an NGO.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "message": "New report assigned to your organization",
    "report_id": "report-uuid",
    "read": false,
    "created_at": "2026-03-11T06:00:00Z"
  }
]
```

---

### Get Single Notification
**GET** `/notifications/:ngoId/:notificationId`

Get details of a specific notification.

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Nigerian States Enum

Valid values for `location` field:
```
Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno,
Cross River, Delta, Ebonyi, Edo, Ekiti, Enugu, Gombe, Imo, Jigawa,
Kaduna, Kano, Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger,
Ogun, Ondo, Osun, Oyo, Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara, FCT
```

---

## Report Status Enum

```
SUBMITTED - Initial state
ACCEPTED - NGO accepted the case
REJECTED - NGO rejected the case
RESOLVED - Case resolved
```

---

## Rate Limiting

- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour

---

## Support

- **Email**: support@safehelpub.com
- **Emergency Hotline**: 199 (Nigeria)
- **WARIF Helpline**: +234-809-210-0009

---

## Changelog

### v1.0.0 (2026-03-11)
- Initial release
- User and NGO registration
- Anonymous reporting
- AI-powered incident analysis
- Email notifications
- File uploads
- Report management

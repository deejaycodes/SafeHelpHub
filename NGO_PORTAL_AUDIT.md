# 🏥 NGO PORTAL FUNCTIONALITY AUDIT
## Domain Expert Review - GBV Response Systems

---

## 📊 **CURRENT NGO PORTAL FEATURES**

### **Backend API Endpoints:**

#### ✅ **ESSENTIAL (Keep)**
1. **POST /ngo/register** - NGO registration
2. **GET /ngo/search** - Find NGOs by location/name
3. **GET /reports** - View assigned reports (with filters)
4. **PATCH /reports/:id** - Accept/Reject/Resolve reports
5. **GET /reports/:id/status** - Check report status

#### ⚠️ **QUESTIONABLE (Review)**
6. **PUT /ngo/onboard** - Update NGO profile (onboarding)
7. **PUT /ngo/update-ngo** - Update NGO data (duplicate?)
8. **DELETE /ngo** - Delete NGO account
9. **POST /ngo/resend-code** - Resend verification code

---

## 🚨 **CRITICAL MISSING FEATURES**

### **1. Case Management** ❌ MISSING
**What NGOs Need:**
```
- View case history
- Add case notes/updates
- Track victim interactions
- Document interventions
- Upload evidence/documents
- Set follow-up reminders
```

**Why Critical:**
- NGOs need to document their work
- Legal requirements for case documentation
- Continuity of care (multiple staff members)
- Accountability and reporting

**Priority:** 🔴 **CRITICAL**

---

### **2. Communication System** ❌ MISSING
**What NGOs Need:**
```
- Secure messaging with victims (if they opt-in)
- Internal notes (staff-only)
- Referral system (to other NGOs/services)
- Status updates to victim
```

**Why Critical:**
- Victims need updates on their case
- NGOs need to coordinate with other services
- Follow-up is essential for GBV response

**Priority:** 🔴 **CRITICAL**

---

### **3. Reporting & Analytics** ❌ MISSING
**What NGOs Need:**
```
- Monthly case statistics
- Response time metrics
- Resolution rate tracking
- Incident type breakdown
- Geographic distribution
- Export reports (PDF/CSV)
```

**Why Critical:**
- Donors require impact reports
- Government reporting requirements
- Internal performance tracking
- Resource allocation decisions

**Priority:** 🟡 **HIGH**

---

### **4. Team Management** ❌ MISSING
**What NGOs Need:**
```
- Add/remove staff members
- Assign cases to specific staff
- Role-based permissions (admin, case worker, viewer)
- Activity logs (who did what)
```

**Why Critical:**
- NGOs have multiple staff members
- Need accountability and audit trails
- Different roles need different access

**Priority:** 🟡 **HIGH**

---

### **5. Resource Library** ❌ MISSING
**What NGOs Need:**
```
- Safety planning templates
- Legal aid resources
- Referral contacts (police, hospitals, shelters)
- Standard operating procedures
- Training materials
```

**Why Critical:**
- Standardizes response quality
- Helps new staff onboard
- Ensures best practices

**Priority:** 🟢 **MEDIUM**

---

### **6. Victim Follow-Up System** ❌ MISSING
**What NGOs Need:**
```
- Schedule follow-up calls/visits
- Track victim progress
- Set reminders for check-ins
- Document outcomes
```

**Why Critical:**
- GBV response is long-term (not one-time)
- Prevents cases from falling through cracks
- Measures real impact

**Priority:** 🔴 **CRITICAL**

---

### **7. Referral Network** ❌ MISSING
**What NGOs Need:**
```
- Refer cases to other NGOs (if outside expertise)
- Track referral status
- Coordinate with hospitals, police, legal aid
- Share case info (with consent)
```

**Why Critical:**
- No single NGO handles all GBV types
- Victims need multi-service support
- Coordination prevents duplication

**Priority:** 🟡 **HIGH**

---

### **8. Emergency Response** ❌ MISSING
**What NGOs Need:**
```
- Hotline integration
- On-call staff roster
- Emergency contact list
- Quick response protocols
```

**Why Critical:**
- Critical cases need immediate response
- 24/7 availability for emergencies
- Clear escalation paths

**Priority:** 🔴 **CRITICAL**

---

## ❌ **UNNECESSARY FEATURES (Remove/Simplify)**

### **1. DELETE /ngo** - Delete NGO Account
**Why Unnecessary:**
- NGOs rarely delete accounts
- Dangerous (loses all case history)
- Better: Deactivate/suspend instead

**Recommendation:** 
```
Replace with:
- PUT /ngo/deactivate (soft delete)
- Preserve data for legal/audit purposes
```

---

### **2. Duplicate Update Endpoints**
**Current:**
- PUT /ngo/onboard
- PUT /ngo/update-ngo

**Why Confusing:**
- Two endpoints do same thing
- Unclear which to use

**Recommendation:**
```
Merge into one:
- PUT /ngo/profile (handles all updates)
```

---

### **3. Resend Verification Code**
**Why Low Priority:**
- One-time use (during registration)
- Can be handled by "Forgot Password" flow

**Recommendation:**
```
Keep but deprioritize
- Most NGOs verify once
- Focus on core case management
```

---

## 🎯 **PRIORITY IMPLEMENTATION ROADMAP**

### **Phase 1: Critical (Week 1-2)**
1. ✅ **Case Notes System**
   ```typescript
   POST /reports/:id/notes
   GET /reports/:id/notes
   PUT /reports/:id/notes/:noteId
   ```

2. ✅ **Status Updates to Victim**
   ```typescript
   POST /reports/:id/updates
   // Sends notification to victim (if opted-in)
   ```

3. ✅ **Follow-Up Scheduling**
   ```typescript
   POST /reports/:id/followups
   GET /ngo/followups/upcoming
   PATCH /followups/:id/complete
   ```

---

### **Phase 2: High Priority (Week 3-4)**
4. ✅ **Team Management**
   ```typescript
   POST /ngo/staff
   GET /ngo/staff
   DELETE /ngo/staff/:id
   POST /reports/:id/assign (assign to staff member)
   ```

5. ✅ **Basic Analytics**
   ```typescript
   GET /ngo/stats
   // Returns: total cases, resolved, pending, by type
   ```

6. ✅ **Referral System**
   ```typescript
   POST /reports/:id/refer
   GET /ngo/referrals/incoming
   GET /ngo/referrals/outgoing
   ```

---

### **Phase 3: Medium Priority (Month 2)**
7. ✅ **Resource Library**
   ```typescript
   GET /resources
   POST /resources (admin only)
   ```

8. ✅ **Advanced Analytics**
   ```typescript
   GET /ngo/reports/monthly
   GET /ngo/reports/export (PDF/CSV)
   ```

9. ✅ **Emergency Response**
   ```typescript
   GET /ngo/on-call-roster
   POST /reports/:id/escalate
   ```

---

## 📊 **COMPARISON: Current vs Ideal**

| Feature | Current | Needed | Priority |
|---------|---------|--------|----------|
| **Registration** | ✅ Yes | ✅ Yes | ✅ |
| **View Reports** | ✅ Yes | ✅ Yes | ✅ |
| **Accept/Reject** | ✅ Yes | ✅ Yes | ✅ |
| **Case Notes** | ❌ No | ✅ Yes | 🔴 Critical |
| **Victim Updates** | ❌ No | ✅ Yes | 🔴 Critical |
| **Follow-Ups** | ❌ No | ✅ Yes | 🔴 Critical |
| **Team Management** | ❌ No | ✅ Yes | 🟡 High |
| **Analytics** | ❌ No | ✅ Yes | 🟡 High |
| **Referrals** | ❌ No | ✅ Yes | 🟡 High |
| **Resources** | ❌ No | ✅ Yes | 🟢 Medium |
| **Emergency** | ❌ No | ✅ Yes | 🔴 Critical |

---

## 🎯 **MINIMAL VIABLE NGO PORTAL (MVP+)**

### **Must Have (Launch Blockers):**
1. ✅ View assigned reports
2. ✅ Accept/Reject reports
3. ✅ **Add case notes** ← MISSING
4. ✅ **Update victim on progress** ← MISSING
5. ✅ Mark case as resolved

### **Should Have (Month 1):**
6. ✅ **Schedule follow-ups** ← MISSING
7. ✅ **Basic stats dashboard** ← MISSING
8. ✅ **Refer to other NGOs** ← MISSING

### **Nice to Have (Month 2+):**
9. Team management
10. Resource library
11. Advanced analytics

---

## 🚨 **REAL-WORLD NGO WORKFLOW**

### **Current System (Incomplete):**
```
1. NGO sees report in dashboard ✅
2. NGO accepts report ✅
3. NGO contacts victim ❌ (no system for this)
4. NGO provides services ❌ (no documentation)
5. NGO follows up ❌ (no tracking)
6. NGO closes case ✅
```

### **Ideal System:**
```
1. NGO sees report in dashboard ✅
2. NGO accepts report ✅
3. NGO adds initial assessment note ← ADD THIS
4. NGO sends status update to victim ← ADD THIS
5. NGO schedules follow-up (1 week) ← ADD THIS
6. NGO documents each interaction ← ADD THIS
7. NGO refers to legal aid (if needed) ← ADD THIS
8. NGO marks milestones (safety plan, counseling, etc.) ← ADD THIS
9. NGO schedules final follow-up (3 months) ← ADD THIS
10. NGO closes case with outcome report ← ADD THIS
```

---

## 💡 **QUICK WINS (Implement First)**

### **1. Case Notes API (2 hours)**
```typescript
// File: src/cores/reports/case-notes.controller.ts

@Post(':reportId/notes')
async addNote(
  @Param('reportId') reportId: string,
  @Body() noteDto: { content: string; type: 'internal' | 'victim_update' },
  @Req() req
) {
  return this.caseNotesService.create({
    reportId,
    ngoId: req.user.id,
    staffMember: req.user.name,
    content: noteDto.content,
    type: noteDto.type,
    createdAt: new Date(),
  });
}

@Get(':reportId/notes')
async getNotes(@Param('reportId') reportId: string) {
  return this.caseNotesService.findByReport(reportId);
}
```

**Impact:** NGOs can document their work immediately

---

### **2. Follow-Up System (3 hours)**
```typescript
// File: src/cores/reports/followups.controller.ts

@Post(':reportId/followups')
async scheduleFollowUp(
  @Param('reportId') reportId: string,
  @Body() followUpDto: { scheduledDate: Date; notes: string }
) {
  return this.followUpsService.create({
    reportId,
    scheduledDate: followUpDto.scheduledDate,
    notes: followUpDto.notes,
    status: 'pending',
  });
}

@Get('followups/upcoming')
async getUpcomingFollowUps(@Req() req) {
  return this.followUpsService.findUpcoming(req.user.id);
}
```

**Impact:** NGOs never miss follow-ups

---

### **3. Basic Stats Dashboard (2 hours)**
```typescript
// File: src/cores/ngo/ngo-stats.controller.ts

@Get('stats')
async getStats(@Req() req) {
  const ngoId = req.user.id;
  
  return {
    totalCases: await this.reportsRepo.countByNgo(ngoId),
    activeCases: await this.reportsRepo.countActive(ngoId),
    resolvedCases: await this.reportsRepo.countResolved(ngoId),
    byType: await this.reportsRepo.countByType(ngoId),
    avgResponseTime: await this.reportsRepo.avgResponseTime(ngoId),
    thisMonth: await this.reportsRepo.countThisMonth(ngoId),
  };
}
```

**Impact:** NGOs can report to donors/government

---

## 🎯 **RECOMMENDATION**

### **For MVP Launch:**
**Current system is 40% complete.**

**Critical Gaps:**
1. ❌ No case documentation
2. ❌ No victim communication
3. ❌ No follow-up tracking

**Recommendation:**
```
Option A: Launch with current features + manual workarounds
- NGOs use external tools (WhatsApp, Excel) for notes
- Risk: Poor user experience, low adoption

Option B: Add 3 quick wins (1 week) then launch
- Case notes (2 hours)
- Follow-ups (3 hours)
- Basic stats (2 hours)
- Total: 7 hours of dev work
- Result: 70% complete, usable system

Option C: Full Phase 1 (2 weeks) then launch
- All critical features
- Result: 90% complete, professional system
```

**My Recommendation: Option B**
- Minimal dev time (1 week)
- Addresses biggest gaps
- NGOs can actually use it
- Can add more features based on feedback

---

## 📝 **SUMMARY**

### **Keep:**
- ✅ Registration
- ✅ View reports
- ✅ Accept/Reject
- ✅ Update status

### **Remove/Simplify:**
- ❌ Delete account (replace with deactivate)
- ❌ Duplicate update endpoints (merge)

### **Add (Critical):**
- 🔴 Case notes
- 🔴 Victim updates
- 🔴 Follow-up scheduling

### **Add (High Priority):**
- 🟡 Team management
- 🟡 Basic analytics
- 🟡 Referral system

---

**Bottom Line:** Your NGO portal has the basics but is missing critical case management features. Add case notes, follow-ups, and basic stats (7 hours of work) before launch.

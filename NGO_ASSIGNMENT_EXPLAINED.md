# 🏥 NGO ASSIGNMENT SYSTEM - SafeVoice

## ⚠️ CURRENT STATUS: **MANUAL ASSIGNMENT**

---

## 🔍 **HOW IT WORKS NOW:**

### **There is NO automatic assignment service.**

Reports are **manually assigned** by NGOs through the dashboard:

```
1. Report submitted → Saved with status: SUBMITTED
2. Report appears in ALL NGO dashboards (filtered by location/type)
3. NGO views report → Decides to accept or reject
4. NGO clicks "Accept" → Report assigned to that NGO
5. Other NGOs can no longer accept (report removed from their dashboards)
```

---

## 📊 **CURRENT FLOW:**

```
USER SUBMITS REPORT
       ↓
┌──────────────────────────────────────────────────────┐
│ Report Created                                       │
│ - status: SUBMITTED                                  │
│ - ngo_dashboard_ids: [] (empty)                      │
│ - accepted_by: []                                    │
│ - rejected_by: []                                    │
└──────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────┐
│ Report Visible to ALL NGOs                           │
│ (NGOs filter by location, incident type, urgency)   │
└──────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────┐
│ NGO #1 Views Report                                  │
│ Options: [Accept] [Reject]                           │
└──────────────────────────────────────────────────────┘
       ↓
   NGO Clicks "Accept"
       ↓
┌──────────────────────────────────────────────────────┐
│ Report Updated:                                      │
│ - status: ACCEPTED                                   │
│ - accepted_by: [ngo1_id]                             │
│ - ngo_dashboard_ids: [] (cleared)                    │
│ - assigned_ngo: ngo1_id                              │
└──────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────┐
│ Report Removed from Other NGO Dashboards             │
│ Only NGO #1 can now update/resolve                   │
└──────────────────────────────────────────────────────┘
```

---

## 🔧 **KEY FUNCTIONS:**

### **1. View Reports (NGO Dashboard)**
```typescript
// File: reports.repository.ts
async findReports(userId: string, query: any): Promise<Report[]> {
  const queryBuilder = this.reportRepository.createQueryBuilder('report');
  
  // Filter by status
  if (query.status) {
    queryBuilder.andWhere('report.status = :status', { status: query.status });
  }
  
  // Filter by location
  if (query.location) {
    queryBuilder.andWhere('report.location = :location', { location: query.location });
  }
  
  // Show reports assigned to this NGO
  queryBuilder.andWhere(':userId = ANY(report.ngo_dashboard_ids)', { userId });
  
  return await queryBuilder.getMany();
}
```

**What This Does:**
- NGO sees reports in their `ngo_dashboard_ids` array
- Can filter by status, location, urgency
- Initially, all reports visible to all NGOs

---

### **2. Accept Report (Manual Assignment)**
```typescript
// File: reports.service.ts
async updateReportStatus(reportId: string, ngoId: string, updateData) {
  const report = await this.reportsRepository.fetchSingleReportById(reportId);
  
  // Check if already accepted
  if (report.accepted_by?.includes(ngoId)) {
    throw new ConflictException('You have already accepted this report');
  }
  
  if (updateData.status === ReportStatus.ACCEPTED) {
    // Update report
    report.status = ReportStatus.ACCEPTED;
    report.ngo_dashboard_ids = []; // Clear from all dashboards
    report.accepted_by = report.accepted_by || [];
    report.accepted_by.push(ngoId);
    
    // Update NGO stats
    const ngo = await this.usersRepository.fetchSingleUserById(ngoId);
    ngo.acceptReportsCount = (ngo.acceptReportsCount || 0) + 1;
    ngo.isHandlingReport = true;
    await this.usersRepository.findUserByIdAndUpdate(ngoId, ngo);
    
    return await this.reportsRepository.save(report);
  }
}
```

**What This Does:**
- NGO accepts report
- Report status → ACCEPTED
- Report removed from other NGO dashboards
- NGO's `acceptReportsCount` incremented

---

### **3. Reject Report**
```typescript
if (updateData.status === ReportStatus.REJECTED) {
  // Check if already rejected
  if (report.rejected_by?.includes(ngoId)) {
    throw new ConflictException('You have already rejected this report');
  }
  
  // Add to rejected list
  report.rejected_by = report.rejected_by || [];
  report.rejected_by.push(ngoId);
  
  // Add rejection reason
  if (updateData.rejection_reason) {
    report.rejection_reasons = report.rejection_reasons || [];
    report.rejection_reasons.push({
      reason: updateData.rejection_reason,
      rejectedBy: ngoId,
      rejectedAt: new Date(),
    });
  }
  
  return await this.reportsRepository.save(report);
}
```

**What This Does:**
- NGO rejects report
- Report stays visible to other NGOs
- Rejection reason logged

---

### **4. Resolve Report**
```typescript
if (updateData.status === ReportStatus.RESOLVED) {
  // Only accepting NGO can resolve
  if (report.status !== ReportStatus.ACCEPTED) {
    throw new ConflictException('Only accepted reports can be resolved');
  }
  
  report.status = ReportStatus.RESOLVED;
  
  // Update NGO stats
  const ngo = await this.usersRepository.fetchSingleUserById(ngoId);
  ngo.resolvedReportsCount = (ngo.resolvedReportsCount || 0) + 1;
  await this.usersRepository.findUserByIdAndUpdate(ngoId, ngo);
  
  return await this.reportsRepository.save(report);
}
```

---

## 📋 **REPORT STATES:**

| Status | Description | Visible To | Can Accept | Can Resolve |
|--------|-------------|------------|------------|-------------|
| **SUBMITTED** | New report | All NGOs | ✅ Yes | ❌ No |
| **ACCEPTED** | NGO accepted | Accepting NGO only | ❌ No | ✅ Yes |
| **REJECTED** | NGO rejected | Other NGOs | ✅ Yes | ❌ No |
| **RESOLVED** | Case closed | Accepting NGO only | ❌ No | ❌ No |
| **PENDING_REVIEW** | Unclear spam | Admin only | ❌ No | ❌ No |

---

## ⚠️ **PROBLEMS WITH CURRENT SYSTEM:**

### **1. No Automatic Assignment**
- Reports sit unassigned until NGO manually accepts
- Urgent cases might be missed
- No guarantee of response

### **2. Race Conditions**
- Multiple NGOs might try to accept same report
- First one wins, others get error

### **3. No Load Balancing**
- One NGO might accept all reports
- Others sit idle
- No fair distribution

### **4. No Matching Logic**
- No consideration of NGO expertise
- No location-based routing
- No capacity checking

### **5. No Escalation**
- If no NGO accepts, report sits forever
- No automatic escalation to admin
- No SLA tracking

---

## 🚀 **RECOMMENDED: AUTOMATIC ASSIGNMENT SERVICE**

### **Phase 1: Smart Assignment (Immediate)**

Create a new service that automatically assigns reports:

```typescript
// File: src/cores/assignment/assignment.service.ts

@Injectable()
export class AssignmentService {
  
  @OnEvent(REPORT_EVENTS.ANALYZED)
  async autoAssignReport(payload: ReportAnalyzedEvent) {
    const report = await this.reportsRepository.findById(payload.reportId);
    
    // Find matching NGOs
    const eligibleNgos = await this.findEligibleNgos(report);
    
    // Assign to top 3 NGOs
    report.ngo_dashboard_ids = eligibleNgos.slice(0, 3).map(ngo => ngo.id);
    
    await this.reportsRepository.save(report);
    
    // Notify NGOs
    for (const ngo of eligibleNgos.slice(0, 3)) {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.NGO_ALERT, {
        ngoId: ngo.id,
        reportId: report.id,
        urgency: payload.urgency,
      });
    }
  }
  
  private async findEligibleNgos(report: Report) {
    const ngos = await this.usersRepository.findNgosByLocation(report.location);
    
    // Score NGOs based on:
    // 1. Specialization (incident type match)
    // 2. Current workload (fewer active cases = higher score)
    // 3. Response time (faster = higher score)
    // 4. Success rate (resolved cases / accepted cases)
    
    return ngos
      .map(ngo => ({
        ...ngo,
        score: this.calculateScore(ngo, report),
      }))
      .sort((a, b) => b.score - a.score);
  }
  
  private calculateScore(ngo: any, report: Report): number {
    let score = 0;
    
    // Specialization match (40 points)
    if (ngo.specializations?.includes(report.incident_type)) {
      score += 40;
    }
    
    // Low workload (30 points)
    const workloadScore = Math.max(0, 30 - (ngo.activeReportsCount || 0) * 3);
    score += workloadScore;
    
    // Success rate (30 points)
    const successRate = ngo.resolvedReportsCount / (ngo.acceptReportsCount || 1);
    score += successRate * 30;
    
    return score;
  }
}
```

---

### **Phase 2: Escalation System**

```typescript
@Injectable()
export class EscalationService {
  
  // Check for unassigned reports every 30 minutes
  @Cron('*/30 * * * *')
  async checkUnassignedReports() {
    const unassigned = await this.reportsRepository.find({
      where: {
        status: ReportStatus.SUBMITTED,
        created_at: LessThan(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours old
      },
    });
    
    for (const report of unassigned) {
      // Escalate to more NGOs
      await this.assignmentService.expandAssignment(report.id);
      
      // If critical and still unassigned after 4 hours, alert admin
      if (report.ai_analysis?.urgency === 'critical') {
        const age = Date.now() - report.created_at.getTime();
        if (age > 4 * 60 * 60 * 1000) {
          await this.notificationService.alertAdmin(report.id);
        }
      }
    }
  }
}
```

---

### **Phase 3: Load Balancing**

```typescript
@Injectable()
export class LoadBalancerService {
  
  async redistributeLoad() {
    const ngos = await this.usersRepository.findAllNgos();
    
    // Find overloaded NGOs (>10 active cases)
    const overloaded = ngos.filter(ngo => ngo.activeReportsCount > 10);
    
    // Find underutilized NGOs (<3 active cases)
    const underutilized = ngos.filter(ngo => ngo.activeReportsCount < 3);
    
    // Suggest reassignment
    for (const ngo of overloaded) {
      const reports = await this.reportsRepository.findByNgo(ngo.id);
      const lowPriority = reports.filter(r => r.ai_analysis?.urgency === 'low');
      
      // Suggest moving low-priority cases to underutilized NGOs
      this.logger.log(`Suggest moving ${lowPriority.length} reports from ${ngo.name}`);
    }
  }
}
```

---

## 🎯 **IMPLEMENTATION PRIORITY:**

### **Immediate (Week 1):**
1. ✅ Current manual system works
2. ✅ Add notification when report assigned to NGO dashboard

### **Short-term (Month 1):**
1. Add automatic assignment to top 3 matching NGOs
2. Add escalation for unassigned reports (2+ hours)
3. Add admin dashboard for monitoring

### **Long-term (Month 3):**
1. Add load balancing
2. Add NGO performance metrics
3. Add ML-based matching (learn from past assignments)

---

## 📝 **SUMMARY:**

**Current System:**
- ❌ No automatic assignment
- ✅ Manual accept/reject by NGOs
- ✅ First-come-first-served
- ❌ No load balancing
- ❌ No escalation

**Recommended:**
- ✅ Auto-assign to top 3 matching NGOs
- ✅ Score-based matching (specialization + workload + success rate)
- ✅ Escalation for unassigned reports
- ✅ Load balancing
- ✅ Admin monitoring

**For MVP:** Current manual system is acceptable. Add auto-assignment in Month 2.

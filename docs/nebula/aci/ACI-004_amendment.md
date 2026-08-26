<!-- RECOVERED RECORD -->
Source: CAE conversation history (Cursor agent transcript).
This is not a QEN-packaged ACI file that previously lived in the ADE repo.
Recovered during ACI-007. Do not treat as independently versioned QEN package metadata.

# ACI-004 Amendment — README Product Intent + Runtime Truth
Continue ACI-004 from the current implementation state.
Do not restart or redo completed ACI-004 work solely because of this amendment.
## 1. README Product Intent Update
Update the ADE `README.md` so the product description is user-focused rather than TAIG-specific.
Replace language that primarily describes ADE as turning TAIG work into approved content with the following product-level intent:
> **The Accretion Disk Engine (ADE) is designed to increase a user's social media viewership and online presence by automating repetitive content-management tasks and using AI-assisted analytics to evaluate performance and improve future content. ADE helps users create, review, schedule, publish, measure, and continuously improve social media content from one centralized hub.**
The short product intent is:
> **Automate the manual work of social media management and use AI-assisted analytics to continuously improve content, viewership, and online presence.**
TAIG may remain documented as the initial user/test environment, but ADE itself must be described as a general product for its users.
Do not claim capabilities as currently implemented unless they actually exist.
## 2. Runtime Truth
The two reported `next dev` exits were caused by intentional process stops during the ACI-004 restart validation.
They were **not ADE startup failures**.
The initial process retained port 3000, was subsequently stopped, and ADE was successfully restarted.
Current runtime state:
**ADE RUNNING**
`http://localhost:3000`
Record the restart validation as **PASS**.
Do not classify the intentional process termination or temporary port ownership as an ADE capability defect.
## 3. Continue ACI-004
Continue validation and completion of:
**Source → Draft → Review → Approval → Publishing Queue → Manual/Mock Facebook Adapter**
Complete the success path, failure path, provenance, persistence/restart validation, and UI workflow requirements from the governing ACI-004.
## Completion
Return the normal ACI-004 completion package, including the updated `README.md` and:
`ADE_ACI_004_VERTICAL_SLICE_COMPLETION_REPORT.md`
Then stop for Build QEN review.

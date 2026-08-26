<!-- RECOVERED RECORD -->
Source: CAE conversation history (Cursor agent transcript).
This is not a QEN-packaged ACI file that previously lived in the ADE repo.
Recovered during ACI-007. Do not treat as independently versioned QEN package metadata.

# ACI-001 — ADE Existing Project Recovery & Current-State Intake
**Product:** Accretion Disk Engine (ADE)
**QEN:** Social Engine Build QEN
**Execution:** AIA / CAE — Local
**Type:** Discovery / Recovery
**Implementation Changes:** NOT AUTHORIZED
## Mission
Locate the existing **Accretion Disk Engine (ADE)** project and return enough evidence to the Build QEN to establish an authoritative technical Current Truth before any implementation decisions are made.
Do **not** redesign, refactor, upgrade, repair, or add features during this ACI.
## CAE Instructions
### 1. Locate the Existing ADE Project
Identify the local project believed to be the existing ADE/Social Engine implementation.
Report:
* project name;
* absolute/local project path;
* repository status, if applicable;
* current branch, if applicable;
* last known modification/build state;
* whether the project appears complete, partial, experimental, abandoned, or actively usable.
If multiple candidate ADE/Social Engine projects exist, identify all of them and determine which appears to be the authoritative/latest implementation. Do not silently choose between conflicting candidates.
### 2. Inventory the Complete Project
Inspect the project and report:
* directory/file structure;
* frontend technology;
* backend technology;
* database/persistence;
* AI/model integrations;
* APIs/integrations;
* dependencies;
* environment/configuration requirements;
* build/run commands;
* localhost configuration;
* tests;
* documentation;
* Docker/container assets, if present;
* Git/repository configuration, if present.
Identify major modules and explain their apparent purpose.
### 3. Determine Existing Capabilities
Report what the application currently appears capable of doing.
Specifically inspect for:
* dashboard/hub UI;
* source intake;
* content creation;
* embedded AI;
* content editing;
* human approval/rejection;
* publishing;
* scheduling/queue;
* Facebook integration;
* other social integrations;
* analytics;
* goals;
* audience/follower tracking;
* leads/opportunities;
* business attribution;
* recommendations/intelligence;
* authentication;
* settings/configuration.
For each capability classify:
**WORKING | PARTIAL | PRESENT BUT UNVERIFIED | NOT FOUND | BROKEN**
Do not infer capability merely from filenames. Distinguish implemented behavior from placeholders, mockups, TODOs, documentation, and intended future functionality.
### 4. Inspect the Existing UI
Describe:
* pages/screens;
* navigation;
* primary workflows;
* reusable UI components;
* apparent design system;
* what the Operator can actually do through the interface;
* obvious dead ends or incomplete screens.
Screenshots may be included where useful.
Do not redesign the UI during this ACI.
### 5. Determine Local Run State
Attempt only safe, non-destructive validation necessary to determine whether the existing project can run locally.
Report:
**RUNS | RUNS WITH ISSUES | CANNOT CURRENTLY RUN | NOT SAFE/READY TO ATTEMPT**
If it runs, report:
* startup procedure;
* localhost address/port;
* major runtime errors/warnings;
* which capabilities were actually observed.
Do not perform destructive migrations, external publishing, production changes, or broad dependency upgrades merely to make the project run.
### 6. Identify External Dependencies
List anything the project currently requires outside the local application, including:
* API credentials;
* AI provider keys;
* Facebook/Meta configuration;
* databases;
* cloud services;
* third-party services;
* OAuth configuration;
* missing local tools;
* unavailable services.
Do not expose secret values. Report only the dependency and whether configuration appears present/missing.
### 7. Return the Existing Project to the QEN
Prepare a complete project package for return to the Social Engine Build QEN.
Include the source/project necessary for QEN review while excluding:
* secrets;
* API keys;
* passwords;
* tokens;
* unnecessary dependency/cache directories;
* generated temporary files.
Where appropriate, include a sanitized environment example showing required variable names without secret values.
### 8. Produce the ACI-001 Current-State Report
Return a concise report containing:
1. **Project Located**
2. **Project Path / Repository State**
3. **Technology Stack**
4. **Architecture Summary**
5. **Project Structure**
6. **Existing Capability Matrix**
7. **UI Current State**
8. **AI Current State**
9. **Persistence/Data Current State**
10. **Integrations Current State**
11. **Local Runtime Status**
12. **External Dependencies**
13. **Known Problems / Incomplete Areas**
14. **Existing Documentation**
15. **Project Package Returned**
16. **Anything CAE believes the QEN must know before planning implementation**
## Required Return Package
CAE must return:
**A. `ADE_ACI_001_CURRENT_STATE_REPORT.md`**
**B. Sanitized complete ADE project package/folder**
**C. Relevant screenshots or runtime evidence, if available**
**D. Any existing architecture/readme/design documentation discovered inside the project**
## Restrictions
Do not:
* implement new ADE features;
* redesign the UI;
* integrate Postiz;
* integrate Mixpost;
* change architecture;
* perform broad refactoring;
* replace dependencies;
* perform external social publishing;
* fabricate missing information.
Postiz/Mixpost hybrid assessment belongs to the **next planning/assessment stage after the QEN understands the existing ADE project**.
## Completion Condition
ACI-001 is complete when the Build QEN can answer:
> **What ADE project currently exists, what is actually implemented, what works, what does not, how does it run, and what assets do we have available for the next build decision?**
**Return findings and project package to the Social Engine Build QEN. Stop after reporting.**

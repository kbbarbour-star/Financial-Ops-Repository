# Meridian Financial ITSM & Knowledge Base

This application uses entirely fictional data for educational and portfolio demonstration purposes. It does not represent an actual financial institution or contain real customer information.

An interactive ITIL v4 financial institution incident management workspace, 7-tab relational dataset explorer (236 total records), live elapsed-calendar-time (`24x7`) SLA tracker, and multi-tab CSV/ZIP exporter.

## Dataset Structure

| Tab | Records | Description |
| :--- | :---: | :--- |
| **Incidents** | 30 | Financial institution incidents (`FIN-INC-2001`–`FIN-INC-2030`) across active, escalated, resolved, and breached states |
| **Users** | 30 | Analysts, L1–L3 engineers, DBAs, and incident commanders (`USR-101`–`USR-130`) |
| **AssignmentGroups** | 30 | Financial support squads, routing rules, and escalation channels (`GRP-201`–`GRP-230`) |
| **Services** | 30 | Business and technical banking services (`SVC-301`–`SVC-330`) with regulatory scope and RTO/RPO |
| **SLA_Definitions** | 30 | Response and resolution targets (`SLA-401`–`SLA-430`) using **Elapsed Calendar Time (`24x7`)** |
| **IncidentActivity** | 30 | Chronological audit trail of state changes, escalations, and SLA breaches (`ACT-501`–`ACT-530`) |
| **KnowledgeBase** | 56 | Preserved historical operational triage playbooks and postmortems (`INC-1001`–`INC-1056`) |

## Key Features

- **Elapsed Calendar Time SLA Engine (`24x7x365`)**: Calculates response and resolution compliance continuously without business-hour pauses, classifying incidents as `Within Target`, `At Risk`, `Breached`, or `Met`.
- **Relational Cross-Tab Inspector**: Click any table row or foreign-key ID (`Service ID`, `Group ID`, `User ID`, `SLA ID`, `KB Ref`, `Incident ID`) to traverse linked records in a slide-over detail drawer.
- **Multi-Tab CSV & ZIP Export**: Download the active tab as an RFC 4180 `.csv` file or export all 7 tabs together in a single `.zip` archive (`Meridian_Financial_ITSM_7Tabs.zip`).

## Data Architecture and Persistence

### Data Storage

Meridian Financial ITSM currently operates as a **client-side demonstration application** using predefined, fictional datasets stored in TypeScript source files.

The application does not currently connect to a database, external data service, or persistent backend.

### Dataset Management

The application loads seven predefined datasets from the `src/data/` directory:

| Dataset | Source File | Records |
|---|---|---:|
| Incidents and Activity | `incidentsAndActivity.ts` | 60 |
| Users and Assignment Groups | `usersAndGroups.ts` | 60 |
| Services | `services.ts` | 30 |
| SLA Definitions | `slaDefinitions.ts` | 30 |
| Knowledge Base | `knowledgeBase.ts` | 56 |
| **Total** | | **236** |

*Note: The source files combine certain datasets, but the application presents them as seven separate tabs.*

### Application Behavior

The current implementation supports:

- Viewing and exploring predefined incident records.
- Searching, filtering, and sorting dataset records.
- Navigating relationships between incidents, services, users, assignment groups, SLAs, and knowledge-base records.
- Calculating incident SLA status using elapsed calendar time (24x7).
- Exporting individual datasets to CSV.
- Exporting all seven datasets into a ZIP archive.

### Persistence Limitations

The current version does not support:

- Creating or permanently modifying incident records.
- Saving user-generated records.
- Persisting changes between application sessions.
- Database transactions or server-side data processing.
- User authentication or role-based access control.

Changes to the application's temporary interface state are not stored in a centralized data repository.

### Future Development

Database integration and persistent incident management capabilities may be introduced in a future development phase.

Potential enhancements include:

- Centralized relational database storage.
- Incident creation and modification.
- Persistent assignment and workflow management.
- User authentication and role-based access control.
- Audit history and activity tracking.

**Demonstration Disclaimer:** All records and scenarios are fictional and intended exclusively for educational, development, and portfolio demonstration purposes. This application is not connected to an actual financial institution and should not be used to manage production incidents or real customer information.

## Local Development

```bash
npm install
npm run dev
```

Build the standalone static site into `dist/`:

```bash
npm run build
npm run preview
```

## Deploying to GitHub Pages

This repository includes `.github/workflows/deploy.yml` and relative asset paths (`base: './'` in `vite.config.ts`).

1. Push the project to a GitHub repository on the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Meridian Financial ITSM workspace"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In your GitHub repository, open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. The workflow will build `dist/` and publish the live app to `https://<your-username>.github.io/<your-repo>/`.

# Cover Page

Milestone: 3
Date: March 6th, 2026
Group Number: 119

| Name | Student # | CS Alias | Preferred Email |
|----------|----------|----------|----------|
| Katrina Wei  | 11890225  | p6c6v  | katrinawei05@gmail.com |
| Kevin Xu  | 55195432  | c1a6u  | xukevin2005@gmail.com |
| Daniel Zhou  | 11504941 | n6e8p  | danielzhou.nc@gmail.com |

By typing our names and student numbers in the above table, we certify that the work in the attached assignment was performed solely by those whose names and student IDs are included above.

In addition, we indicate that we are fully aware of the rules and consequences of
plagiarism, as set forth by the Department of Computer Science and the University of
British Columbia.

# Project Summary

Our project models a complete game session of Monopoly, tracking players, turns, board spaces, property ownership, and financial transactions to accurately reflect Monopoly rules and gameplay. It stores the current game state and historical events, allowing a game session to be tracked and reviewed.

# AI Acknowledgement

- ChatGPT was used to create a draft timeline of the completion of tasks that was edited to fit our project and individual schedules.
https://chatgpt.com/share/69aa8823-0194-8000-be31-63fbce1b4105
- ChatGPT was also used to help quickly import our milestone 1/2 docs into .md files.
https://chatgpt.com/share/69ab9f80-db64-8005-a986-308542c79ba2

---

# Local Setup Guide (No Credentials)

This guide explains how to run the app locally while connecting to the UBC Oracle database, and how to load the Monopoly schema/data up to the current project state.

## 1) Prerequisites

- Windows machine (instructions below use PowerShell), or macOS with Terminal
- Access to UBC remote server and Oracle account (`ora_<cwl>@stu`)
- Node.js installed (`node --version` should work)
- Oracle Instant Client (64-bit, Basic Light ZIP) extracted locally; on macOS use the Oracle Instant Client build for your Mac (Intel vs Apple Silicon)
- On Windows: Microsoft Visual C++ Redistributable installed (required by Oracle client DLLs)

## 2) Install Node packages

From project root:

```powershell
npm install
```

macOS: same command in Terminal.

## 3) Configure `.env` (no hardcoded personal values in repo)

Create/update `.env` in project root with the following keys:

```env
ORACLE_USER=ora_<your_cwl>
ORACLE_PASS=<your_password>
ORACLE_HOST=localhost
ORACLE_PORT=50000
ORACLE_DBNAME=stu
PORT=65534
```

Notes:
- Do not add spaces after values.
- Keep `.env` untracked.

## 4) Configure Oracle Instant Client startup script

Run:

```powershell
.\scripts\win\instantclient-setup.cmd
```

When prompted, enter the absolute path of your extracted Instant Client folder.  
This generates/updates `local-start.cmd`.

macOS: `./scripts/mac/instantclient-setup.sh` (creates `local-start.sh`). `chmod +x local-start.sh scripts/mac/db-tunnel.sh` if needed.

## 5) Start DB tunnel (Terminal A)

Run and keep this terminal open:

```powershell
.\scripts\win\db-tunnel.cmd
```
macOS: `sh ./scripts/mac/db-tunnel.sh`

This script:
- opens SSH tunnel to UBC DB host
- updates `.env` host/port for local access

## 6) Start app locally (Terminal B)

Run:

```powershell
.\local-start.cmd
```

Expected healthy output:
- `Server running at http://localhost:<port>/`
- `Connection pool started`

If you see `ORA-00942` at first launch in the sample app, that is expected for demo table initialization. Use the reset button in UI for demo flow.

macOS: `./local-start.sh`

## 7) Load Monopoly SQL schema + seed data (remote SQL*Plus)

Even with local app deployment, the course database is remote. Use SQL*Plus on remote server for schema/data setup.

From local PowerShell:

```powershell
ssh <your_cwl>@remote.students.cs.ubc.ca "mkdir -p ~/CPSC304-Monopoly"
scp -r ".\sql" <your_cwl>@remote.students.cs.ubc.ca:~/CPSC304-Monopoly/
ssh <your_cwl>@remote.students.cs.ubc.ca
```

macOS Terminal: same three commands, but use `scp -r ./sql ...` instead of `.\sql`.

Then on remote:

```bash
rlwrap sqlplus ora_<your_cwl>@stu
```

In SQL*Plus:

```sql
HOST pwd
@/home/d/<your_cwl>/CPSC304-Monopoly/sql/setup.sql
```

Important:
- Use full absolute path with `@...` in SQL*Plus (do not use `~`).
- If needed, verify file exists:

```sql
HOST ls -l /home/d/<your_cwl>/CPSC304-Monopoly/sql
```

## 8) Expected SQL setup result

`sql/setup.sql` runs:
- `drop.sql`
- `schema.sql`
- `insert.sql`
- `verify.sql`

Success criteria:
- table creation succeeds
- inserts commit
- verification row counts and sample joins return data

## 9) Common issues

- `DPI-1047`: Instant Client not found in runtime path. Re-run the setup script for your OS (`instantclient-setup.cmd` or `scripts/mac/instantclient-setup.sh`); on Windows verify VC++ redistributable.
- `ORA-12154`: malformed connect string (commonly whitespace in `.env`) or tunnel not active.
- `ORA-01017`: wrong Oracle username/password.
- `SP2-0310`: SQL*Plus cannot find script path; use full absolute path.

---

At this point, local runtime + Oracle connectivity + Monopoly schema/seed data are all configured.

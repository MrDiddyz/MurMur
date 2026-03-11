# MurMur Architecture (v1)

MurMur is a modular multi-agent AI system designed around orchestration, agents, jobs, and memory.

The goal of MurMur is to explore **collective intelligence**, where multiple AI agents collaborate to solve problems.

---

## System Overview

User
↓
Frontend (Next.js)
↓
API Layer
↓
God Agent (Orchestrator)
↓
Agent Council
↓
Specialized Agents
↓
Worker Runtime
↓
Database / Memory

---

## Core Components

### Frontend

The MurMur dashboard where users interact with the system.

Responsibilities:

* create jobs
* display results
* monitor agents
* visualize activity

Technology:

* Next.js
* TypeScript

---

### API Layer

Handles incoming requests from the UI.

Examples:

POST /api/jobs
GET /api/jobs

Responsibilities:

* receive tasks
* create job records
* trigger agent workflows

---

### God Agent (Orchestrator)

The central coordinator of the MurMur system.

Responsibilities:

* assign jobs to agents
* manage workflows
* coordinate multi-agent tasks
* combine outputs

---

### Agent Council

A decision layer where multiple agents evaluate a problem.

Example agents:

Scientist Agent
Strategist Agent
Engineer Agent
Creative Agent

The council compares outputs and selects the best result.

---

### Specialized Agents

Agents with specific roles.

Examples:

Research Agent
Analyst Agent
Memory Agent
Builder Agent

Each agent has:

* defined role
* input
* output
* limited scope

---

### Worker Runtime

Background processes that execute tasks.

Responsibilities:

* process jobs
* run agents
* update results
* log outputs

Workers allow MurMur to run asynchronously.

---

### Database / Memory

Stores system data.

Responsibilities:

* job records
* agent outputs
* knowledge storage
* system logs

Planned backend:

* Supabase
* Postgres

---

## Repository Structure

MurMur/

app/
worker/
lib/
supabase/
components/

docs/
Agents.md
Architecture.md
ROADMAP.md

---

## Current Status

MurMur is in early development.

Version 1 focuses on:

* basic project structure
* job creation
* API endpoints
* worker runtime
* agent architecture design

Future versions will introduce:

* agent orchestration
* council reasoning
* memory systems
* advanced workflows


flowchart TD
  classDef priority1 fill:#fff3e0,stroke:#e65100,color:#000

  %% ══════════════════════════════════════════════════════════
  %% LAYER 0 — ACTORS
  %% ══════════════════════════════════════════════════════════
  subgraph ACTORS["👤 External Actors"]
    AE["AE"]
    SDR["SDR"]
    SM["Manager"]
    VP["VP Sales"]
    RO["RevOps"]
  end

  %% ══════════════════════════════════════════════════════════
  %% FRONTEND
  %% ══════════════════════════════════════════════════════════
  subgraph FE["🖥️ Frontend · Next.js"]
    UI1["Transcripts"]
    UI2["Ask AI"]
    UI3["Deals"]
    UI4["Dashboards"]
  end

  %% ══════════════════════════════════════════════════════════
  %% PLATFORM CORE
  %% ══════════════════════════════════════════════════════════
  subgraph CORE["⚙️ Platform Core · NestJS"]
    GW["API Gateway"]
    AUTH["Auth + RBAC"]
    RLS["Tenant Isolation"]
  end

  %% ══════════════════════════════════════════════════════════
  %% MONOLITH MODULES
  %% ══════════════════════════════════════════════════════════
  subgraph MONO["🧩 Modular Monolith"]

    M01["M01 Capture"]
    M02["M02 Email"]
    M03["M03 Revenue Graph (Priority 1)"]:::priority1
    M04["M04 Intelligence"]
    M05["M05 Search/Tracking"]
    M06["M06 Insights/RAG"]
    M07["M07 Deals"]
    M08["M08 Automation"]
    M09["M09 Forecast"]
    M10["M10 Coaching"]

    BUS["Event Queue (BullMQ)"]
  end

  %% ══════════════════════════════════════════════════════════
  %% AI SERVICES (CENTRALIZED)
  %% ══════════════════════════════════════════════════════════
  subgraph AI["🤖 AI Services · FastAPI"]

    AIORCH["LangGraph Orchestrator
    (Single Post-Call Pipeline)"]

    AISUMM["Summarize"]
    AIDETECT["Detect Signals"]
    AISCORE["Score + Topics"]
    AIEMAIL["Generate Email"]
    AIEMBED["Embeddings"]
    AIASK["RAG Query"]
  end

  %% ══════════════════════════════════════════════════════════
  %% TRANSCRIPTION SERVICE
  %% ══════════════════════════════════════════════════════════
  subgraph TRANS["🎙️ Transcription Service"]
    TR1["Fetch Audio"]
    TR2["Diarization"]
    TR3["Whisper"]
    TR4["Post-process"]
  end

  %% ══════════════════════════════════════════════════════════
  %% DATA LAYER
  %% ══════════════════════════════════════════════════════════
  subgraph DATA["🗄️ Data Layer"]
    PG["PostgreSQL"]
    REDIS["Redis"]
    MEI["Meilisearch"]
    VEC["pgvector"]
    CH["ClickHouse (optional)"]
    S3["Object Storage"]
  end

  %% ══════════════════════════════════════════════════════════
  %% EXTERNAL SYSTEMS
  %% ══════════════════════════════════════════════════════════
  subgraph EXT["🌐 External Systems"]
    CRM["CRM"]
    CONF["Meetings"]
    EMAIL["Email"]
    LLM["LLM APIs"]
    SLACK["Slack"]
    LI["LinkedIn Sales Nav"]
    DW["Data Warehouses (Snowflake, BigQuery)"]
  end

  %% ══════════════════════════════════════════════════════════
  %% FLOW — USER
  %% ══════════════════════════════════════════════════════════
  AE & SDR --> UI1 & UI2
  SM --> UI3
  VP --> UI4

  UI1 & UI2 & UI3 & UI4 --> GW
  GW --> AUTH --> RLS

  RLS --> M01 & M02 & M03 & M04 & M05 & M06 & M07 & M08 & M09 & M10

  %% ══════════════════════════════════════════════════════════
  %% CAPTURE FLOW (FIXED)
  %% ══════════════════════════════════════════════════════════
  CONF --> M01
  M01 -->|"call.created"| BUS

  BUS --> TR1
  TR1 --> TR2 --> TR3 --> TR4
  TR4 -->|"transcript"| M01

  M01 -->|"call.transcription.completed"| BUS

  %% ══════════════════════════════════════════════════════════
  %% AI PIPELINE (CENTRALIZED)
  %% ══════════════════════════════════════════════════════════
  BUS -->|"call.transcription.completed"| AIORCH

  AIORCH --> AIDETECT
  AIORCH --> AISUMM
  AIORCH --> AISCORE
  AIORCH --> AIEMAIL
  AIORCH --> AIEMBED

  AISUMM -->|"summary.generated"| BUS
  AISCORE -->|"call.scored"| BUS
  AIDETECT -->|"tracker.detected"| BUS
  AIEMAIL -->|"email.drafted"| BUS

  %% ══════════════════════════════════════════════════════════
  %% MODULE CONSUMERS
  %% ══════════════════════════════════════════════════════════
  BUS --> M04
  BUS --> M05
  BUS --> M06
  BUS --> M07
  BUS --> M08
  BUS --> M10

  %% ══════════════════════════════════════════════════════════
  %% RAG (ONLY DIRECT AI CALL ALLOWED)
  %% ══════════════════════════════════════════════════════════
  M06 -->|"query"| AIASK
  AIASK --> VEC

  %% ══════════════════════════════════════════════════════════
  %% SEARCH + EMBEDDINGS
  %% ══════════════════════════════════════════════════════════
  BUS -->|"summary.generated"| AIEMBED
  AIEMBED --> VEC
  M05 --> MEI

  %% ══════════════════════════════════════════════════════════
  %% CRM + EMAIL
  %% ══════════════════════════════════════════════════════════
  M03 <-->|sync| CRM
  M02 <-->|send/receive| EMAIL
  M08 -->|alerts| SLACK
  M01 -->|ingest| LI
  M03 -->|export| DW

  %% ══════════════════════════════════════════════════════════
  %% DATA WRITES
  %% ══════════════════════════════════════════════════════════
  M01 & M02 & M03 & M04 & M05 & M06 & M07 & M08 & M09 & M10 --> PG
  BUS <--> REDIS
  M01 --> S3
  M09 & M10 --> CH

  %% ══════════════════════════════════════════════════════════
  %% AI → LLM
  %% ══════════════════════════════════════════════════════════
  AIORCH & AISUMM & AIDETECT & AISCORE & AIEMAIL & AIASK & AIEMBED --> LLM
# PairScope: Performance Bottlenecks & Scaling Strategy

This document provides a technical evaluation of potential performance bottlenecks within the PairScope architecture, alongside a structured scaling and caching strategy designed to support growth from MVP to multi-region scale.

---

## 1. Potential Performance Bottlenecks

Based on the architectural specifications outlined in the PairScope MVP Product Requirements Document, several key subsystems present inherent scaling and performance constraints under concurrent workloads.

```
                   +---------------------------------------+
                   |           API Gateway                 |
                   +-------------------+-------------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
          v                            v                            v
+-------------------+        +-------------------+        +-------------------+
|  Realtime Service |        | Execution Service |        | Recorder Service  |
+---------+---------+        +---------+---------+        +---------+---------+
          |                            |                            |
  [High WebSocket]            [Container Startup]          [High Write Vol /]
  [Yjs Sync Pressure]         [CDP Socket Flood]           [Stream Saturation]
```

### 1.1 Live Realtime Collaboration & State Sync (Realtime Service)
* **Yjs Document Delta Operations:** High-frequency keystroke synchronization across multiple participants requires continuous merging of operation-based CRDT deltas. Under rapid collaborative editing or large document sizes, CPU consumption on the WebSocket server rises significantly.
* **WebSocket Connection Fan-Out & Memory Footprint:** Maintaining long-lived WebSocket connections requires substantial memory. Ephemeral presence events (cursor movements, active selection) generated at 60 Hz per client can saturate connection socket buffers if not throttled or debounced.

### 1.2 Isolated Code Execution & Debugging (Execution Service)
* **Docker Container Lifecycle Latency:** Provisioning disposable Docker containers per execution request introduces disk I/O and process spawn latency (typically 200ms–1.5s per cold boot). Concurrent run requests can quickly exhaust host CPU and memory pools.
* **Chrome DevTools Protocol (CDP) Telemetry Overhead:** Real-time debugging streams high volumes of call stack frames, local scope variables, and object references over internal CDP WebSocket connections. Serializing deep object trees on execution pause creates both memory overhead and transmission delays to the Realtime gateway.

### 1.3 High-Throughput Event Ingestion (Recorder Service)
* **Write Saturation on High-Frequency Session Events:** Persistence of ordered editing steps and debugger state transitions (`(sessionId, sequence)`) can lead to high write pressure. During active debugging, event bursts can bottleneck traditional relational or document databases if written synchronously.
* **Replay Snapshot Generation & Reconstruction:** Reconstructing document and runtime state for replay requires either scanning large sequential log streams or running computationally expensive aggregation pipelines on demand.

### 1.4 Centralized State & Shared Infrastructure Dependencies
* **Single-Node Bottlenecks (Redis Pub/Sub & Queues):** Using Redis for ephemeral state, job queues (BullMQ), and realtime adapter backplanes means a shared Redis instance can experience CPU exhaustion (due to single-threaded event processing) under heavy message traffic.
* **Database Connection Pool Exhaustion:** As microservices scale horizontally, aggregate connections to primary databases (MongoDB for Session/Identity, Event Store) can exceed host connection limits, causing connection queuing and latency spikes.

---

## 2. Scaling Strategy

### 2.1 Horizontal & Vertical Scaling Plans

```
+-----------------------------------------------------------------------------------+
|                                 SCALING PLAN                                      |
+-------------------+-----------------------------------+---------------------------+
| Tier / Service    | Horizontal Scaling                | Vertical Target           |
+-------------------+-----------------------------------+---------------------------+
| API Gateway       | Stateless HPA (CPU > 70%)         | 2-4 vCPU, 4GB RAM         |
| Realtime Service  | HPA on Active Sockets / Memory    | 4-8 vCPU, 8GB RAM         |
| Execution Workers | Worker Pool / Dynamic Pod Scale   | 8-16 vCPU, 32GB RAM Node  |
| Recorder Service  | Partitioned Consumer Group        | 4 vCPU, 8GB RAM           |
| Primary Databases | Read Replicas / Sharding          | High I/O, Dedicated SSD   |
+-------------------+-----------------------------------+---------------------------+
```

#### A. Realtime Service (WebSockets & Yjs)
* **Horizontal Scaling:** Deploy stateless Realtime nodes behind an API Gateway configured with sticky sessions (IP hash or cookie-based) for connection persistence. Cross-node message broadcasting is achieved via the Redis Adapter pattern.
* **Auto-Scaling Metrics:** Scale out pods based on **active WebSocket connections** (threshold: ~2,500 active sockets/pod) and **CPU utilization** (>70%).

#### B. Execution Service & Container Pool
* **Horizontal Scaling:** Decouple job submission from container execution using a distributed worker architecture (BullMQ / Redis stream consumers). Workers run on dedicated execution nodes to isolate untrusted user code from primary application nodes.
* **Warm Pool Pattern:** Maintain a bounded pool of pre-warmed, paused execution sandbox containers to bypass Docker startup overhead, dropping initialization latency under 50ms.
* **Vertical Scaling Target:** Execution worker hosts prioritize CPU cores and memory (e.g., compute-optimized instances) to maximize concurrent container capacity (64 MB to 256 MB caps per container).

#### C. Recorder & Insights Services
* **Horizontal Scaling:** Partition event consumers by `sessionId` using stream consumer groups. This guarantees in-order event processing per session while allowing aggregate write workloads to scale across multiple instances.
* **Asynchronous Offloading:** Offload snapshot reconstruction and analytics precomputations to asynchronous background workers driven by session-completion events.

#### D. Database Tier
* **MongoDB:** Implement Read Replicas for high-volume query endpoints (e.g., session metadata, user profile validation, question listings). Apply horizontal database sharding on `sessionId` when event log volume exceeds single-replica write capacity.
* **Object Storage Archival:** Move immutable event logs of completed sessions older than 30 days to S3-compatible cold object storage to compress primary database indexes and reduce storage costs.

---

### 2.2 Caching Strategies

PairScope utilizes a **tiered Redis caching architecture** designed for high availability, minimal latency, and strict data-isolation standards across microservices.

```
                           +------------------------+
                           |  Redis Caching Layers  |
                           +-----------+------------+
                                       |
      +--------------------------------+--------------------------------+
      |                                |                                |
      v                                v                                v
+--------------------------+ +--------------------------+ +--------------------------+
|  Layer 1: Identity/Auth  | |  Layer 2: Realtime State | | Layer 3: Insights/Replay|
| - JWT Revocation Lists   | | - Ephemeral Yjs State    | | - Pre-calculated Summaries|
| - Session Metadata       | | - Debugger Ownership     | | - Snapshot Checkpoints   |
| - TTL: 15m - 24h         | | - Active Presence/Cursors| | - TTL: LRU Eviction      |
+--------------------------+ +--------------------------+ +--------------------------+
```

#### A. Auth & Session Metadata Caching (Identity & Session Services)
* **Token Revocation List:** Active JWT jti (JWT ID) revocations and refresh token hashes are stored in Redis with fixed TTLs matching token lifespans.
* **Session & User Metadata:** Session config, question metadata, and authorization claims are cached using a **Read-Through** pattern with an aggressive TTL (e.g., 5 to 15 minutes) to avoid repeated database lookups during active collaboration.

```
[Client Request] --> [Gateway / Service]
                            |
                     (Check Cache)
                      /         \
            [Hit]    /           \   [Miss]
                    v             v
            {Return Data}    {Query DB} --> [Populate Cache with TTL]
```

#### B. Ephemeral Realtime State (Realtime Service)
* **Presence & Debugger Ownership:** Transient state such as cursor position, selection ranges, and active debugger ownership privileges are stored exclusively in memory (Redis Hash / String structures) with low TTLs (5–10 seconds) refreshed via heartbeats. This state does not touch primary persistent storage.
* **Yjs Vector Clocks & State Vectors:** Compute vector clocks and state snapshots periodically in Redis to allow fast reconnection synchronization for disconnected clients without re-reading full event histories.

#### C. Execution & Analytics Caching (Execution & Insights Services)
* **Static Question Code & Test Cases:** Starter code, system test vectors, and LeetCode-style problem definitions are cached in memory on execution nodes.
* **Replay Checkpoints & Snapshots:** Intermediate state snapshots (taken every *N* events) are cached using a **Write-Through** pattern to enable instantaneous timeline scrubbing during replay without executing full event log replays on every scrub request.

#### D. Cache Invalidation & Eviction Policies
* **Eviction Policy:** Configure Redis clusters handling transient state with `volatile-lru` (Least Recently Used with expiry) to prevent out-of-memory panics under load spikes.
* **Invalidation Trigger Events:** Member additions/removals or organization changes publish invalidation messages over Redis Pub/Sub to instantly purge impacted cached authorization payloads across API gateway instances.

---

## 3. Summary of Deliverables & Performance Targets

| Metric / Subsystem | Baseline Strategy | Scaled Target Strategy | Target Performance SLA |
| --- | --- | --- | --- |
| **Editor Sync Latency** | Direct Socket Broadcast | Distributed Redis Backplane | $< 100 \text{ ms}$ (p95, intra-region) |
| **Sandbox Execution Startup** | Cold Docker Run | Pre-Warmed Container Pool | $< 100 \text{ ms}$ boot time |
| **Event Persistence** | Synchronous Ingestion | Partitioned Durable Stream Consumers | $10,000+$ events/sec throughput |
| **Replay Timeline Scrubbing** | Full Log Reconstruction | Periodic Snapshot Retrieval (Cached) | $< 250 \text{ ms}$ state render |
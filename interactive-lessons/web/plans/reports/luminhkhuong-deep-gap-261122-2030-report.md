# luminhkhuong.dev deep gap analysis vs our interview lessons

Date: 2026-11-22. Scope: every content page under the site's Java, Spring, database, Redis, Kafka, security, SOLID, design patterns, low-level design, API design, testing, system design (incl. 49 problem breakdowns) and Java/Spring interview-question sections. Skipped: DSA/LeetCode, AWS, DevOps, git, networking, OS, blockchain, AI agents, banking, books, company pages, tags.

Method: sitemap.xml (3,417 URLs) → 427 in-scope pages, fetched as static HTML (Docusaurus, no JS needed), article text extracted, split into 21 topic batches. Each batch was read page by page and every candidate point was grep-checked against `src/data/lessons/*.ts` before being called a gap. Only junior-to-mid relevant items kept; this report lists High and Medium items (Low items omitted as trivia).

## 1. Pages read

427 pages: 316 read in full, 111 skimmed (marked; mostly senior/ops depth such as Kafka Streams internals, OpenSearch ops, CockroachDB, BFT, staff-level SD problems, and single-pattern GoF pages whose interview sections were read in full).

<details><summary>Full list of 427 URLs</summary>

- https://luminhkhuong.dev/java/jpa-hibernate-lifecycle-methods
- https://luminhkhuong.dev/technical-knowledge/api-design/api-design-interview-questions
- https://luminhkhuong.dev/technical-knowledge/api-design/api-security-owasp-checklist
- https://luminhkhuong.dev/technical-knowledge/api-design/contract-governance-testing (skimmed: low relevance, Spectral/oasdiff/Prism governance is senior/platform)
- https://luminhkhuong.dev/technical-knowledge/api-design/errors-pagination-filtering
- https://luminhkhuong.dev/technical-knowledge/api-design/intro
- https://luminhkhuong.dev/technical-knowledge/api-design/naming-conventions
- https://luminhkhuong.dev/technical-knowledge/api-design/openapi-swagger-fundamentals
- https://luminhkhuong.dev/technical-knowledge/api-design/reliability-idempotency-webhooks
- https://luminhkhuong.dev/technical-knowledge/api-design/resource-modeling-http-semantics
- https://luminhkhuong.dev/technical-knowledge/api-design/spring-boot-springdoc-openapi
- https://luminhkhuong.dev/technical-knowledge/api-design/versioning-evolution
- https://luminhkhuong.dev/technical-knowledge/database/ (skimmed: index page only)
- https://luminhkhuong.dev/technical-knowledge/database/acid
- https://luminhkhuong.dev/technical-knowledge/database/advanced-sql
- https://luminhkhuong.dev/technical-knowledge/database/backup-recovery
- https://luminhkhuong.dev/technical-knowledge/database/connection-pooling
- https://luminhkhuong.dev/technical-knowledge/database/data-warehousing-olap (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/database/database-design
- https://luminhkhuong.dev/technical-knowledge/database/database-patterns-microservices
- https://luminhkhuong.dev/technical-knowledge/database/database-security
- https://luminhkhuong.dev/technical-knowledge/database/exporting-large-datasets-streaming-internals
- https://luminhkhuong.dev/technical-knowledge/database/full-text-search (skimmed: headings + interview Q&A)
- https://luminhkhuong.dev/technical-knowledge/database/indexing-query-optimization
- https://luminhkhuong.dev/technical-knowledge/database/isolation-levels
- https://luminhkhuong.dev/technical-knowledge/database/long-transactions-undo-mdl-meltdown
- https://luminhkhuong.dev/technical-knowledge/database/mysql-deadlocks-gap-locks-internals
- https://luminhkhuong.dev/technical-knowledge/database/mysql-indexing-beyond-equality
- https://luminhkhuong.dev/technical-knowledge/database/nosql-distributed
- https://luminhkhuong.dev/technical-knowledge/database/online-ddl-gh-ost-pt-osc-internals (skimmed: mostly senior/ops; took the PG CONCURRENTLY + MDL points)
- https://luminhkhuong.dev/technical-knowledge/database/optimistic-vs-pessimistic-lock-deep-dive
- https://luminhkhuong.dev/technical-knowledge/database/performance-monitoring
- https://luminhkhuong.dev/technical-knowledge/database/postgresql-brin-index-guide (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/database/postgresql-checkpoint-wal-tuning (skimmed: low relevance, ops tuning)
- https://luminhkhuong.dev/technical-knowledge/database/postgresql-heap-storage-architecture
- https://luminhkhuong.dev/technical-knowledge/database/postgresql-update-locking-mechanics (mostly already covered by locking.ts)
- https://luminhkhuong.dev/technical-knowledge/database/postgresql-wal-replication-lag-playbook (skimmed: low relevance, ops)
- https://luminhkhuong.dev/technical-knowledge/database/production-database-antipatterns-hygiene
- https://luminhkhuong.dev/technical-knowledge/database/query-optimization-beyond-indexes-upsert-traps
- https://luminhkhuong.dev/technical-knowledge/database/query-planner-optimizer
- https://luminhkhuong.dev/technical-knowledge/database/relational-fundamentals
- https://luminhkhuong.dev/technical-knowledge/database/replication-partitioning
- https://luminhkhuong.dev/technical-knowledge/database/schema-migrations
- https://luminhkhuong.dev/technical-knowledge/database/storage-engines-data-structures
- https://luminhkhuong.dev/technical-knowledge/database/time-series-databases (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/database/transactions-concurrency
- https://luminhkhuong.dev/technical-knowledge/database/vector-databases-deep-dive (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/abstract-factory
- https://luminhkhuong.dev/technical-knowledge/design-patterns/adapter (skimmed body; interview Qs and tables read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/bridge (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/builder
- https://luminhkhuong.dev/technical-knowledge/design-patterns/chain-of-responsibility (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/command (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/composite (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/decorator (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/design-patterns-overview
- https://luminhkhuong.dev/technical-knowledge/design-patterns/facade (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/factory-method
- https://luminhkhuong.dev/technical-knowledge/design-patterns/flyweight (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/interpreter (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/iterator (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/mediator (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/memento (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/observer (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/prototype
- https://luminhkhuong.dev/technical-knowledge/design-patterns/proxy
- https://luminhkhuong.dev/technical-knowledge/design-patterns/singleton
- https://luminhkhuong.dev/technical-knowledge/design-patterns/state (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/strategy (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/template-method (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/design-patterns/visitor (skimmed body; interview Qs read)
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/java-collections-interview-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/java-interview-questions-100
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/java-interview-questions-trickiest
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/java-multithreading-interview-guide
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/java-oops-interview-guide
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock-interview/java-spring-boot-14-years-interview-detailed
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/accenture-java-springboot-interview-3-years
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/cognizant-java-developer-interview-3-years
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/epam-java-developer-interview-experience
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/hcl-java-developer-interview-experience
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/ibm-java-springboot-interview-3-years
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/paytm-java-developer-interview-first-round
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/tcs-java-springboot-interview-3-years
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/tcs-ninja-nqt-interview-experience (OS/networking/DSA parts skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/wipro-java-springboot-interview-3-years
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/spring-boot/real-time-spring-boot-interview-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/spring-boot/scenario-based-springboot-interview-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/spring-boot/spring-boot-tricky-interview-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/spring-boot/spring-boot-tricky-interview-questions-2
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/spring-boot/spring-boot-tricky-interview-questions-3
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/spring-boot/spring-boot-tricky-interview-questions-4
- https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/spring-boot/top-spring-security-interview-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/grokking-java/java-interview-answers-part-1
- https://luminhkhuong.dev/technical-knowledge/interview-questions/grokking-java/java-interview-answers-part-2
- https://luminhkhuong.dev/technical-knowledge/interview-questions/grokking-java/java-interview-answers-part-3
- https://luminhkhuong.dev/technical-knowledge/interview-questions/grokking-java/java-interview-answers-part-4
- https://luminhkhuong.dev/technical-knowledge/interview-questions/grokking-java/java-interview-answers-part-5
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/break-singleton-java
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/concurrent-collections-interview
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/concurrent-collections-tricky
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/exception-handling-advanced
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/experienced-java-backend-interview
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-8-optional-crud
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-8-tricky-interview-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-collections-differences
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-collections-interview
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-collections-interview-p2
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-comprehensive-interview
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-date-time-api
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-experienced-interview-p1
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-interview-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-lead-interview-scenarios (skimmed: low relevance, lead/STAR-level)
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-multithreading-interview
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-runtime-exceptions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-string-basics
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-string-rotation (skimmed: low relevance, coding puzzle)
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-tricky-core-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/spring-boot-interview
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/spring-boot-real-time-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/sql-interview-questions
- https://luminhkhuong.dev/technical-knowledge/interview-questions/java/tricky-java-interview
- https://luminhkhuong.dev/technical-knowledge/java/concurrency-vs-parallelism
- https://luminhkhuong.dev/technical-knowledge/java/java-aqs-internals
- https://luminhkhuong.dev/technical-knowledge/java/java-classloaders-metaspace
- https://luminhkhuong.dev/technical-knowledge/java/java-collections
- https://luminhkhuong.dev/technical-knowledge/java/java-concurrency
- https://luminhkhuong.dev/technical-knowledge/java/java-diagnostics-troubleshooting
- https://luminhkhuong.dev/technical-knowledge/java/java-dynamic-bytecode-agents
- https://luminhkhuong.dev/technical-knowledge/java/java-functional-interfaces-factory
- https://luminhkhuong.dev/technical-knowledge/java/java-fundamentals
- https://luminhkhuong.dev/technical-knowledge/java/java-gc
- https://luminhkhuong.dev/technical-knowledge/java/java-gc-g1-deep-dive
- https://luminhkhuong.dev/technical-knowledge/java/java-gc-zgc-generational
- https://luminhkhuong.dev/technical-knowledge/java/java-graalvm-aot
- https://luminhkhuong.dev/technical-knowledge/java/java-interview-questions (concurrency/JVM/GC parts read but only checked for errors; they belong to other batches)
- https://luminhkhuong.dev/technical-knowledge/java/java-io
- https://luminhkhuong.dev/technical-knowledge/java/java-jit-compiler
- https://luminhkhuong.dev/technical-knowledge/java/java-jmm-memory-model
- https://luminhkhuong.dev/technical-knowledge/java/java-jvm
- https://luminhkhuong.dev/technical-knowledge/java/java-lmax-disruptor (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/java/java-lock-free-varhandle (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/java/java-locks
- https://luminhkhuong.dev/technical-knowledge/java/java-logging-slf4j-stacktrace
- https://luminhkhuong.dev/technical-knowledge/java/java-new-features
- https://luminhkhuong.dev/technical-knowledge/java/java-object-class
- https://luminhkhuong.dev/technical-knowledge/java/java-object-layout-memory
- https://luminhkhuong.dev/technical-knowledge/java/java-off-heap-ffm-api (skimmed: low relevance, Java 22 FFM/Panama, senior niche)
- https://luminhkhuong.dev/technical-knowledge/java/java-oop
- https://luminhkhuong.dev/technical-knowledge/java/java-overview (skimmed: low relevance, index page)
- https://luminhkhuong.dev/technical-knowledge/java/java-serialization-security
- https://luminhkhuong.dev/technical-knowledge/java/java-stack-vs-heap
- https://luminhkhuong.dev/technical-knowledge/java/java-threads
- https://luminhkhuong.dev/technical-knowledge/java/java-virtual-threads
- https://luminhkhuong.dev/technical-knowledge/java/java-zero-copy-serialization (skimmed: low relevance, Protobuf/FlatBuffers/SBE)
- https://luminhkhuong.dev/technical-knowledge/java/production-oom-debugging-guide
- https://luminhkhuong.dev/technical-knowledge/java/thread-pools-and-connection-pooling
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/exactly-once-vs-dedup
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-connect (skimmed: interview Qs + headings)
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-connect-smts (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-data-governance
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-exactly-once
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-log-compaction
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-mirrormaker2 (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-performance-tuning
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-security-acls (skimmed: interview Qs + headings)
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-security-authentication
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-security-best-practices
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-streams-deep-dive (skimmed: low relevance; duplicates the streams/* pages)
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/kafka-throughput-optimization
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/monitoring-operations
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/order-messages
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/processing-and-ordering
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/rebalance-storms (skimmed: low relevance, Kafka Connect ops runbook)
- https://luminhkhuong.dev/technical-knowledge/kafka/advanced/schema-registry (skimmed: low relevance, mostly ops)
- https://luminhkhuong.dev/technical-knowledge/kafka/consumer/consumer-group
- https://luminhkhuong.dev/technical-knowledge/kafka/consumer/consumer-lag
- https://luminhkhuong.dev/technical-knowledge/kafka/consumer/consumer-overview
- https://luminhkhuong.dev/technical-knowledge/kafka/consumer/parallel-consumer
- https://luminhkhuong.dev/technical-knowledge/kafka/core/kafka-broker
- https://luminhkhuong.dev/technical-knowledge/kafka/core/kafka-overview
- https://luminhkhuong.dev/technical-knowledge/kafka/core/kafka-partitioning-strategies
- https://luminhkhuong.dev/technical-knowledge/kafka/core/kafka-producers-consumers
- https://luminhkhuong.dev/technical-knowledge/kafka/core/kafka-vs-rabbitmq
- https://luminhkhuong.dev/technical-knowledge/kafka/core/kafka-zero-copy-page-cache (skimmed: low relevance beyond the 4-pillars summary)
- https://luminhkhuong.dev/technical-knowledge/kafka/core/kraft-vs-zookeeper (skimmed: low relevance, ops/Strimzi)
- https://luminhkhuong.dev/technical-knowledge/kafka/core/partition
- https://luminhkhuong.dev/technical-knowledge/kafka/core/raft-consensus (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/kafka/core/replication
- https://luminhkhuong.dev/technical-knowledge/kafka/core/scaling-partitions
- https://luminhkhuong.dev/technical-knowledge/kafka/core/topic
- https://luminhkhuong.dev/technical-knowledge/kafka/interview/interview-advanced
- https://luminhkhuong.dev/technical-knowledge/kafka/interview/interview-core
- https://luminhkhuong.dev/technical-knowledge/kafka/interview/interview-producer-consumer
- https://luminhkhuong.dev/technical-knowledge/kafka/intro
- https://luminhkhuong.dev/technical-knowledge/kafka/producer/hash-key-partitions
- https://luminhkhuong.dev/technical-knowledge/kafka/producer/producer-acks
- https://luminhkhuong.dev/technical-knowledge/kafka/producer/producer-idempotency
- https://luminhkhuong.dev/technical-knowledge/kafka/producer/producer-overview
- https://luminhkhuong.dev/technical-knowledge/kafka/producer/producer-transactions
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/interview-questions
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/invalid-topology-updates (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/overview
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/processor-api-dlq (DLQ, async anti-pattern, Serdes sections read; PAPI skimmed)
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/production-runbook (anti-patterns + EOS read; rest skimmed)
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/redis-external-state-offset-fencing (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/spring-boot
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/state-stores-rocksdb (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/topology-architecture (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/kafka/streams/windowing-joins (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/low-level-design/concurrency/coordination
- https://luminhkhuong.dev/technical-knowledge/low-level-design/concurrency/correctness
- https://luminhkhuong.dev/technical-knowledge/low-level-design/concurrency/scarcity
- https://luminhkhuong.dev/technical-knowledge/low-level-design/design-patterns/behavioral
- https://luminhkhuong.dev/technical-knowledge/low-level-design/design-patterns/creational
- https://luminhkhuong.dev/technical-knowledge/low-level-design/design-patterns/overview
- https://luminhkhuong.dev/technical-knowledge/low-level-design/design-patterns/structural
- https://luminhkhuong.dev/technical-knowledge/low-level-design/oop/concepts
- https://luminhkhuong.dev/technical-knowledge/low-level-design/oop/principles
- https://luminhkhuong.dev/technical-knowledge/low-level-design/problem/amazon-locker
- https://luminhkhuong.dev/technical-knowledge/low-level-design/problem/connect-four
- https://luminhkhuong.dev/technical-knowledge/low-level-design/problem/elevator
- https://luminhkhuong.dev/technical-knowledge/low-level-design/problem/file-system
- https://luminhkhuong.dev/technical-knowledge/low-level-design/problem/inventory-management
- https://luminhkhuong.dev/technical-knowledge/low-level-design/problem/movie-ticket
- https://luminhkhuong.dev/technical-knowledge/low-level-design/problem/parking-lot
- https://luminhkhuong.dev/technical-knowledge/low-level-design/problem/rate-limiter
- https://luminhkhuong.dev/technical-knowledge/redis/redis-advanced-data-structures (HLL/geo/skiplist math skimmed)
- https://luminhkhuong.dev/technical-knowledge/redis/redis-as-database
- https://luminhkhuong.dev/technical-knowledge/redis/redis-clustering-replication
- https://luminhkhuong.dev/technical-knowledge/redis/redis-data-types
- https://luminhkhuong.dev/technical-knowledge/redis/redis-distributed-cache
- https://luminhkhuong.dev/technical-knowledge/redis/redis-distributed-lock
- https://luminhkhuong.dev/technical-knowledge/redis/redis-eviction-policies
- https://luminhkhuong.dev/technical-knowledge/redis/redis-interview-questions
- https://luminhkhuong.dev/technical-knowledge/redis/redis-lua-scripting-distributed-locks
- https://luminhkhuong.dev/technical-knowledge/redis/redis-overview
- https://luminhkhuong.dev/technical-knowledge/redis/redis-performance-patterns
- https://luminhkhuong.dev/technical-knowledge/redis/redis-pipeline-transactions
- https://luminhkhuong.dev/technical-knowledge/redis/redis-pubsub
- https://luminhkhuong.dev/technical-knowledge/redis/redis-rate-limiting (multi-region section skimmed)
- https://luminhkhuong.dev/technical-knowledge/redis/redis-session-management
- https://luminhkhuong.dev/technical-knowledge/redis/redis-streams
- https://luminhkhuong.dev/technical-knowledge/redis/redis-ttl-expiry
- https://luminhkhuong.dev/technical-knowledge/security/api-security
- https://luminhkhuong.dev/technical-knowledge/security/authentication-authorization
- https://luminhkhuong.dev/technical-knowledge/security/cookies-vs-sessions-vs-jwt
- https://luminhkhuong.dev/technical-knowledge/security/cryptography-secure-design
- https://luminhkhuong.dev/technical-knowledge/security/identity-access-management (skimmed: low relevance, cloud IAM/K8s RBAC/Vault)
- https://luminhkhuong.dev/technical-knowledge/security/incident-response (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/security/interview-questions
- https://luminhkhuong.dev/technical-knowledge/security/jwt-oauth2-oidc-deep-dive
- https://luminhkhuong.dev/technical-knowledge/security/keys-signing-tls
- https://luminhkhuong.dev/technical-knowledge/security/network-security (skimmed: low relevance, VPC/WAF/DDoS/DNSSEC)
- https://luminhkhuong.dev/technical-knowledge/security/privacy-compliance (skimmed: low relevance, GDPR/PCI)
- https://luminhkhuong.dev/technical-knowledge/security/refresh-token-security-invalidation
- https://luminhkhuong.dev/technical-knowledge/security/secure-sdlc (skimmed: low relevance, SAST/DAST/SCA/STRIDE)
- https://luminhkhuong.dev/technical-knowledge/security/web-security-fundamentals
- https://luminhkhuong.dev/technical-knowledge/security/web-vulnerabilities
- https://luminhkhuong.dev/technical-knowledge/solid/dependency-inversion
- https://luminhkhuong.dev/technical-knowledge/solid/interface-segregation
- https://luminhkhuong.dev/technical-knowledge/solid/liskov-substitution
- https://luminhkhuong.dev/technical-knowledge/solid/open-closed
- https://luminhkhuong.dev/technical-knowledge/solid/single-responsibility
- https://luminhkhuong.dev/technical-knowledge/solid/summary
- https://luminhkhuong.dev/technical-knowledge/spring/hibernate-association-best-practices
- https://luminhkhuong.dev/technical-knowledge/spring/hibernate-transactions-performance
- https://luminhkhuong.dev/technical-knowledge/spring/kubernetes-graceful-shutdown-zero-downtime
- https://luminhkhuong.dev/technical-knowledge/spring/spring-aop
- https://luminhkhuong.dev/technical-knowledge/spring/spring-batch
- https://luminhkhuong.dev/technical-knowledge/spring/spring-boot
- https://luminhkhuong.dev/technical-knowledge/spring/spring-boot-advanced
- https://luminhkhuong.dev/technical-knowledge/spring/spring-boot-bootstrap-yml
- https://luminhkhuong.dev/technical-knowledge/spring/spring-boot-configuration-properties
- https://luminhkhuong.dev/technical-knowledge/spring/spring-boot-internals
- https://luminhkhuong.dev/technical-knowledge/spring/spring-boot-interview-questions
- https://luminhkhuong.dev/technical-knowledge/spring/spring-cloud
- https://luminhkhuong.dev/technical-knowledge/spring/spring-data-jpa
- https://luminhkhuong.dev/technical-knowledge/spring/spring-data-jpa-interview-questions
- https://luminhkhuong.dev/technical-knowledge/spring/spring-data-jpa-query-annotation
- https://luminhkhuong.dev/technical-knowledge/spring/spring-data-jpa-transactions
- https://luminhkhuong.dev/technical-knowledge/spring/spring-exception-handling
- https://luminhkhuong.dev/technical-knowledge/spring/spring-framework
- https://luminhkhuong.dev/technical-knowledge/spring/spring-framework-deep-dive
- https://luminhkhuong.dev/technical-knowledge/spring/spring-interview-questions
- https://luminhkhuong.dev/technical-knowledge/spring/spring-mvc
- https://luminhkhuong.dev/technical-knowledge/spring/spring-overview (skimmed: low relevance, index page)
- https://luminhkhuong.dev/technical-knowledge/spring/spring-security
- https://luminhkhuong.dev/technical-knowledge/spring/spring-transactional-deep-dive
- https://luminhkhuong.dev/technical-knowledge/system-design/16-concurrency-concepts-master-guide (DB/distributed-lock tiers skimmed; covered by locking/redis lessons)
- https://luminhkhuong.dev/technical-knowledge/system-design/60-days-of-system-design (Days 1-26, 30, 39, 40, 47, 51-53, 56, 57, 59, 60 read fully; AI/ML days 27-29, 34, 38, 42, 46, 48, 50, 54, 55, 58 and 31-33, 35-37, 41, 43-45, 49 skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/advanced-consensus-bft (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/api-composition
- https://luminhkhuong.dev/technical-knowledge/system-design/api-design
- https://luminhkhuong.dev/technical-knowledge/system-design/architecture-fundamentals
- https://luminhkhuong.dev/technical-knowledge/system-design/backend-for-frontend
- https://luminhkhuong.dev/technical-knowledge/system-design/bloom-filters (variants/SIMD/Cuckoo/Quotient sections skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/blue-green-deployment
- https://luminhkhuong.dev/technical-knowledge/system-design/bulkhead-pattern
- https://luminhkhuong.dev/technical-knowledge/system-design/caching-strategies (LRU-K/ARC/SIEVE/W-TinyLFU internals and Hazelcast/Ehcache config skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/cap-theorem-system-design (Paxos/Raft/3PC/CRDT code skimmed)
- https://luminhkhuong.dev/technical-knowledge/system-design/capacity-planning
- https://luminhkhuong.dev/technical-knowledge/system-design/case-studies-architecture-scaling (read fully; mostly low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/case-studies-data-migrations (read fully; low relevance: Dropbox/Discord/Vitess/Figma/WhatsApp internals)
- https://luminhkhuong.dev/technical-knowledge/system-design/case-studies-outages-reliability
- https://luminhkhuong.dev/technical-knowledge/system-design/cdc
- https://luminhkhuong.dev/technical-knowledge/system-design/circuit-breaker-pattern
- https://luminhkhuong.dev/technical-knowledge/system-design/cockroachdb-architecture (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/common-interview-questions
- https://luminhkhuong.dev/technical-knowledge/system-design/concurrency-async-threading-models
- https://luminhkhuong.dev/technical-knowledge/system-design/consistent-hashing-deep-dive (Jump hash, Chord, SIMD, security sections skimmed)
- https://luminhkhuong.dev/technical-knowledge/system-design/contract-testing
- https://luminhkhuong.dev/technical-knowledge/system-design/cqrs
- https://luminhkhuong.dev/technical-knowledge/system-design/crdt-collaborative-systems (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/data-consistency (consensus/HLC/snapshot sections skimmed)
- https://luminhkhuong.dev/technical-knowledge/system-design/data-driven-vs-event-driven (read fully, low relevance: restates EDA/outbox/CQRS)
- https://luminhkhuong.dev/technical-knowledge/system-design/database-per-service
- https://luminhkhuong.dev/technical-knowledge/system-design/database-resharding-strategies (skimmed: low relevance, senior ops)
- https://luminhkhuong.dev/technical-knowledge/system-design/dead-letter-queue
- https://luminhkhuong.dev/technical-knowledge/system-design/deployment-strategies
- https://luminhkhuong.dev/technical-knowledge/system-design/distributed-systems
- https://luminhkhuong.dev/technical-knowledge/system-design/distributed-tracing
- https://luminhkhuong.dev/technical-knowledge/system-design/distributed-transactions
- https://luminhkhuong.dev/technical-knowledge/system-design/domain-driven-design
- https://luminhkhuong.dev/technical-knowledge/system-design/envoy-proxy (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/event-driven-microservices
- https://luminhkhuong.dev/technical-knowledge/system-design/externalized-configuration
- https://luminhkhuong.dev/technical-knowledge/system-design/feature-toggle
- https://luminhkhuong.dev/technical-knowledge/system-design/full-system-design-course
- https://luminhkhuong.dev/technical-knowledge/system-design/handling-contention (mostly covered by locking/redis lessons; many low-quality code samples)
- https://luminhkhuong.dev/technical-knowledge/system-design/interview-framework
- https://luminhkhuong.dev/technical-knowledge/system-design/inventory-reservation-system
- https://luminhkhuong.dev/technical-knowledge/system-design/kubernetes-networking (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/large-blobs
- https://luminhkhuong.dev/technical-knowledge/system-design/load-balancing-reliability
- https://luminhkhuong.dev/technical-knowledge/system-design/log-aggregation (hyperscale/ILM/Principal sections skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/long-running-tasks (timing wheels / sharded pollers skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/media-systems-and-testing (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/message-queues
- https://luminhkhuong.dev/technical-knowledge/system-design/microservice-chassis (skimmed: low relevance, it is "your own Boot starter", auto-config already teaches starters)
- https://luminhkhuong.dev/technical-knowledge/system-design/microservices-patterns
- https://luminhkhuong.dev/technical-knowledge/system-design/mongodb-deep-dive
- https://luminhkhuong.dev/technical-knowledge/system-design/nginx-internals (sections 1-11 read; tuning/kernel tail skimmed)
- https://luminhkhuong.dev/technical-knowledge/system-design/observability (TSDB/Gorilla internals skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/opensearch-indexing-schema-operations-guide (skimmed: low relevance; read the mapping matrix)
- https://luminhkhuong.dev/technical-knowledge/system-design/opensearch-query-search-best-practices (skimmed: low relevance; read query-vs-filter and from+size pagination)
- https://luminhkhuong.dev/technical-knowledge/system-design/opensearch-splunk-migration-guide (skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/opentelemetry-sampling-strategies (mostly senior collector ops; only the head-vs-tail idea is relevant)
- https://luminhkhuong.dev/technical-knowledge/system-design/outbox-pattern
- https://luminhkhuong.dev/technical-knowledge/system-design/platform-delivery-reliability
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/ (index)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/ad-click-aggregator
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/amazon-shopping-cart
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/bitly
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/camelcamelcamel
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/chatgpt
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/cookie-consent (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/digital-wallet
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/distributed-cache (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/distributed-file-system (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/distributed-rate-limiter
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/dropbox
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/email-system (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/fb-live-comments
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/fb-news-feed
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/fb-post-search (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/flash-sale
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/google-calendar
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/google-docs (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/google-maps (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/google-news (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/google-search (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/gopuff
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/instagram
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/issue-tracker
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/job-scheduler
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/key-value-store (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/leetcode
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/metrics-monitoring (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/nearby-friends (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/netflix (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/notification-system
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/online-auction
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/online-chess (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/pastebin
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/payment-system
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/robinhood (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/search-autocomplete
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/spotify (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/stock-exchange (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/strava (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/ticketmaster
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/tinder (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/top-k
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/uber (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/web-crawler
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/whatsapp
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/yelp (skimmed: deep-dive headings and trade-off rows only; low relevance for junior-mid)
- https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/youtube
- https://luminhkhuong.dev/technical-knowledge/system-design/proximity-search-geospatial-indexes (beginner part + decision matrix read; S2/H3/Vincenty deep dives skimmed)
- https://luminhkhuong.dev/technical-knowledge/system-design/rate-limiting-algorithms
- https://luminhkhuong.dev/technical-knowledge/system-design/real-time-updates (OT/CRDT and Google Docs sections skimmed: low relevance)
- https://luminhkhuong.dev/technical-knowledge/system-design/resilience-patterns-payments-ticketing
- https://luminhkhuong.dev/technical-knowledge/system-design/retry-pattern
- https://luminhkhuong.dev/technical-knowledge/system-design/reverse-proxy-load-balancer-api-gateway
- https://luminhkhuong.dev/technical-knowledge/system-design/saga-pattern
- https://luminhkhuong.dev/technical-knowledge/system-design/scaling-reads (CDN internals / Anycast / DSA skimmed)
- https://luminhkhuong.dev/technical-knowledge/system-design/scaling-writes (WAL/LSM/compaction/PgBouncer skimmed)
- https://luminhkhuong.dev/technical-knowledge/system-design/search-systems
- https://luminhkhuong.dev/technical-knowledge/system-design/security-patterns
- https://luminhkhuong.dev/technical-knowledge/system-design/senior-engineer-design-course
- https://luminhkhuong.dev/technical-knowledge/system-design/service-decomposition
- https://luminhkhuong.dev/technical-knowledge/system-design/service-discovery
- https://luminhkhuong.dev/technical-knowledge/system-design/service-mesh (skimmed: mostly Istio/Envoy ops)
- https://luminhkhuong.dev/technical-knowledge/system-design/sharded-counters-and-leaderboards
- https://luminhkhuong.dev/technical-knowledge/system-design/sharding-partitioning
- https://luminhkhuong.dev/technical-knowledge/system-design/sidecar-pattern (skimmed: mostly K8s pod internals)
- https://luminhkhuong.dev/technical-knowledge/system-design/split-brain-multi-leader-divergence
- https://luminhkhuong.dev/technical-knowledge/system-design/strangler-fig-pattern
- https://luminhkhuong.dev/technical-knowledge/system-design/time-and-ordering-and-unique-ids (TrueTime/HLC/KSUID/Flickr skimmed)
- https://luminhkhuong.dev/technical-knowledge/system-design/two-phase-commit
- https://luminhkhuong.dev/technical-knowledge/system-design/webhook
- https://luminhkhuong.dev/technical-knowledge/system-design/what-breaks-at-scale
- https://luminhkhuong.dev/technical-knowledge/test/blackbox-and-system-testing (Kafka Streams/JaCoCo remote agent sections skimmed)
- https://luminhkhuong.dev/technical-knowledge/test/spring-test-annotations
- https://luminhkhuong.dev/technical-knowledge/test/testing-concepts
- https://luminhkhuong.dev/technical-knowledge/test/wiremock

</details>

## 2. Gaps per lesson slug (High / Medium only)

Format: `[H|M] site page(s): missing point → **target slug#section** [batch]`. Page refs are short paths under `https://luminhkhuong.dev/technical-knowledge/` (`.../` = that prefix; `GZ/` = `interview-questions/genz-career/`; `S/` = `security/`; bare names like `java-jvm` live in the batch's section, e.g. `java/java-jvm`). Some points appear under two slugs because several batches found them independently (e.g. generics, ClassNotFoundException vs NoClassDefFoundError, `auto.offset.reset`, 202 jobs); treat those as one item.

### advice-aop (5)
- [M] GZ/mock/wipro-java-springboot-interview-3-years, GZ/spring-boot/spring-boot-tricky-interview-questions-4: **Whitelabel Error Page and 404 handling**. Boot's `BasicErrorController` serves `/error`; customise with `error.html` / `error/404.html` or a … → **`advice-aop#problem-detail` or `mvc-flow#response`** [iq-genz]
- [M] java-fundamentals#7, java-interview-questions §9: **reflection and annotations basics** are missing: `getDeclaredField`, `setAccessible(true)`, `method.invoke`, and `@Retention(RUNTIME)` vs CLASS/SOURCE with `@Target`. The interview angle is "how does … → **`advice-aop` (custom-annotation part) or new section in `java-runtime`** [j-lang]
- [M] spring-aop, spring-framework-deep-dive, spring-boot-interview-questions (Q47, Q48, Q51) — **Custom aspect order relative to `@Transactional`**: the transaction advisor defaults to `Ordered.LOWEST_PRECEDENCE`, so a custom `@Around` aspect with any … → **`advice-aop#aop-order`** [spring-core]
- [M] spring-aop, spring-framework-deep-dive — **Pointcut designators beyond `execution`/`@annotation`**: `within(pkg..*)`, `@within(Service)` (annotation on class), `bean(*Service)`, `args(..)`, named `@Pointcut` methods combined with `&&`, `||`, `!`; plus … → **`advice-aop#aop`** [spring-core]
- [M] spring-exception-handling — **Standard MVC exceptions to map to 400/405** that otherwise become generic errors: `MethodArgumentTypeMismatchException` (`/users/abc` for `Long id`), `HttpMessageNotReadableException` (malformed JSON), … → **`advice-aop#problem-detail`** [spring-core]

### api-reliability (1)
- [M] api-design/openapi-swagger-fundamentals, spring-boot-springdoc-openapi — Swagger vs OpenAPI (spec renamed 2015; Swagger = SmartBear tools); springdoc annotations `@Operation`, `@ApiResponse`, `@Schema`, `@Tag`; Bean Validation maps into the spec; … → **`api-reliability#openapi`** [redis-api-test]

### auto-config (8)
- [M] GZ/mock/cognizant-java-developer-interview-3-years, GZ/mock/paytm-java-developer-interview-first-round, GZ/spring-boot/spring-boot-tricky-interview-questions-4: **switching the embedded server**: exclude `spring-boot-starter-tomcat` from starter-web and … → **`auto-config#boot`** [iq-genz]
- [M] GZ/spring-boot/real-time-spring-boot-interview-questions, GZ/spring-boot/spring-boot-tricky-interview-questions-4: **JAR vs WAR**: an executable fat JAR vs a WAR for external Tomcat (`<packaging>war`, extend `SpringBootServletInitializer`). Not in any … → **`auto-config#run`** [iq-genz]
- [H] kubernetes-graceful-shutdown-zero-downtime, spring-boot-advanced, spring-boot-interview-questions (Q29) — **Graceful shutdown is not covered anywhere** (grep: no `server.shutdown`, `timeout-per-shutdown-phase`, `SIGTERM`, `preStop`). Missing: … → **`auto-config#actuator` (extend with probes) or new section "graceful shutdown"; cross-link `microservices#deployment` and `threadpool#spring`** [spring-core]
- [M] spring-boot-configuration-properties — **`-D` system properties beat OS env vars**: `ENTRYPOINT ["java","-Dspring.datasource.url=...","-jar",...]` silently wins over K8s `SPRING_DATASOURCE_URL`. Our precedence section lists command-line > env var > … → **`auto-config#precedence` (add `-D` tier and this trap to the "env var not applied" quiz)** [spring-core]
- [M] spring-boot-configuration-properties — **`${DB_HOST:localhost}` fallback anti-pattern**: a typo in the K8s Secret name silently falls back to localhost and crash-loops instead of failing fast; no defaults for infra endpoints in prod. Also … → **`auto-config#properties`** [spring-core]
- [M] spring-boot-configuration-properties — **Multi-document YAML + `spring.config.activate.on-profile`** (with `prod & eu`, `!prod` expressions) and **profile groups** (`spring.profiles.group.production: [proddb, prodmetrics]`). We only show … → **`auto-config#precedence`** [spring-core]
- [M] spring-boot, spring-boot-interview-questions (Q38, Q46) — **Custom `HealthIndicator`** (`Health.up().withDetail(...)`, `Health.down(e)`), `show-details: when-authorized`, and **health groups** (`management.endpoint.health.group.readiness.include: … → **`auto-config#actuator`** [spring-core]
- [M] spring-boot-configuration-properties — `/actuator/env` leak: `management.endpoint.env.show-values: WHEN_AUTHORIZED` (Boot 3 masks all values by default). We mention "/env public = leak" in security but not the setting → **`auto-config#actuator`** [spring-core]

### bean-lifecycle (1)
- [M] kubernetes-graceful-shutdown-zero-downtime — **Shutdown ordering via `SmartLifecycle` phases**: web server graceful-shutdown lifecycle stops first, DataSource/JPA closed later; custom background schedulers that hold DB connections need … → **`bean-lifecycle#lifecycle`** [spring-core]

### collections (6)
- [M] GZ/mock/hcl-java-developer-interview-experience, GZ/java-interview-questions-100: **HashSet is backed by HashMap** (`add(e)` is `map.put(e, PRESENT)`), so uniqueness = hashCode, then equals. Similarly TreeSet wraps TreeMap. The only mention is one quiz … → **`collections#set-map-order` or `hashmap#map-basics`** [iq-genz]
- [M] GZ/mock/wipro-java-springboot-interview-3-years, GZ/java-interview-questions-100: **Iterator vs ListIterator**. ListIterator is bidirectional, adds `add/set/previous`, and works on List only. "ListIterator" appears nowhere → **`collections#fail-fast`** [iq-genz]
- [M] collections-differences — **ArrayList vs Vector** (Vector synchronizes every method, grows 2x vs 1.5x, and still isn't safe for check-then-act); Array vs ArrayList (primitives, fixed size, `length` vs `size()`). Vector only shows up as a quiz distractor → **`collections#arraylist-linkedlist`** [iq-java]
- [M] collections-interview-p2 Q7, comprehensive Q7 — **WeakHashMap** and the four reference strengths (strong, soft, weak, phantom). grep finds no WeakHashMap or PhantomReference; jvm.ts only mentions Soft/WeakReference. Asked fairly often at mid level → **`collections#set-map-order` or `jvm#leak`** [iq-java]
- [M] .../java/java-concurrency, .../low-level-design/concurrency/correctness: **choosing a thread-safe collection.** `BlockingQueue` variants (ArrayBlockingQueue bounded single lock; LinkedBlockingQueue with separate put/take locks and optional bound; … → **`collections#queues` (or a new "concurrent collections" part in `sync#chm-traps`)** [j-conc]
- [M] .../interview-questions/java/concurrent-collections-tricky: **which sort `Collections.sort`/`Arrays.sort` uses.** TimSort (stable, O(n) on sorted input) for objects; dual-pivot quicksort (unstable) for primitives; why stability matters for objects. Not … → **`collections#comparator-lists`** [j-conc]

### completablefuture (1)
- [M] .../java/concurrency-vs-parallelism, .../system-design/concurrency-async-threading-models: **container CPU limits shrink commonPool.** `availableProcessors()` follows the cgroup `limits.cpu`, so a 2-vCPU pod has commonPool parallelism 1. Then … → **`completablefuture#executor` (and a mention in `optional` parallel-stream part)** [j-conc]

### db-design (6)
- [H] /schema-migrations: **Flyway basics.** File naming is `V{n}__desc.sql` (repeatable files are `R__desc.sql`). `flyway_schema_history` stores a checksum for each applied script, so editing an applied file makes validate/migrate fail. Rule: never edit an … → **new section `db-design#migration` (or a new lesson), with the cheat row kept as the summary** [db-tx]
- [H] /schema-migrations: **Zero-downtime expand–contract, with concrete steps.** (a) To rename a column: add the new column, have the app write to both, backfill, switch reads, then drop the old column. (b) To add a NOT NULL column to a big table: add it … [db-tx]
- [H] /schema-migrations Q8: **Deploy order and backward compatibility.** Run migrations before the new app version starts (init container or pre-deploy step). Every migration must still work with the *old* app version, because during a rolling deploy old and … [db-tx]
- [M] /long-transactions-undo-mdl-meltdown + /online-ddl: **DDL waits behind a long transaction, and every query queues behind the DDL.** An `ALTER TABLE` needs an exclusive metadata lock (MySQL) or ACCESS EXCLUSIVE lock (PG). If a long SELECT or transaction … [db-tx]
- [M] /database-design Q7: **Soft delete** (`deleted_at` plus queries filtering `IS NULL`). Trade-offs: every query must filter, unique constraints break (fix with a partial unique index `... WHERE deleted_at IS NULL`), and the FK story gets messy. … → **new part in `db-design#constraints` or `db-design#normalize`** [db-tx]
- [M] sharded-counters — **Idempotent like**: check-then-INCR races, and retries double-count. Insert `(post_id, user_id)` with a UNIQUE key / `ON CONFLICT DO NOTHING`, and increment only if the row was inserted → **same part; links db-design#constraints and sd-practice#checkout-idempotency** [sd-tech]

### deadlock (5)
- [M] /mysql-deadlocks-gap-locks-internals: **Two transactions deadlock while touching "different" rows (MySQL).** Both run `SELECT ... WHERE id=10 FOR UPDATE` / `id=12 FOR UPDATE` on rows that don't exist; both get a gap lock on the same gap (gap locks don't … → **`deadlock#avoid-db` (one extra cause) + link to the upsert gap** [db-tx]
- [L-M] /mysql-deadlocks Playbook 3: **Where to read a DB deadlock.** MySQL: `SHOW ENGINE INNODB STATUS` → "LATEST DETECTED DEADLOCK" (shows both statements and the index). PG: the server log prints "deadlock detected" with both PIDs and queries. … → **`deadlock#avoid-db`** [db-tx]
- [M] .../java/java-virtual-threads, .../java/concurrency-vs-parallelism, .../java/thread-pools-and-connection-pooling: **virtual threads vs reactive (WebFlux/Netty event loop)** and the golden rule "never block the event loop" (blocking JDBC in WebFlux … → **`deadlock#virtual-threads`** [j-conc]
- [M] .../java/java-jmm-memory-model, .../java/java-concurrency: **why ThreadLocal leaks.** The `ThreadLocalMap` entry key is a `WeakReference` to the ThreadLocal, but the value is a strong reference. With a `static final` ThreadLocal the key never clears, so … → **`deadlock#threadlocal-leak`** [j-conc]
- [M] java-diagnostics-troubleshooting §3 — **Use thread dumps for more than deadlocks.** Take 3 dumps a few seconds apart: persistent BLOCKED = real contention, momentary = normal handoff. Count threads by state (`grep "java.lang.Thread.State" | sort | uniq … → **`deadlock#detect` or `thread#states`** [j-jvm]

### entity-lifecycle (11)
- [M] GZ/spring-boot/real-time-spring-boot-interview-questions, GZ/spring-boot/spring-boot-tricky-interview-questions-4: **soft delete**: a `deleted`/`deleted_at` column, Hibernate `@SQLDelete` + `@SQLRestriction` (which replaces the deprecated `@Where` in … → **new part in `entity-lifecycle` or `db-design`** [iq-genz]
- [H] spring-data-jpa-interview-questions, spring-data-jpa — repository hierarchy `Repository → CrudRepository → (List)PagingAndSortingRepository → JpaRepository` (adds `flush`, `saveAndFlush`, `deleteAllInBatch`, `getReferenceById`, returns `List`); how the … → **new section** [spring-data]
- [H] spring-data-jpa, spring-data-jpa-query-annotation — derived query methods: keywords (`And/Or/Between/LessThan/Containing/In/IsNull/True/OrderBy/Top5/First/IgnoreCase`), `countBy`, `existsBy`; when a name gets too long (3+ conditions, joins, aggregates) … → **new section** [spring-data]
- [H] spring-data-jpa-query-annotation — `@Query` JPQL vs native: JPQL uses entity/field names, portable, validated at startup (app fails to boot on typo); native uses table/column names, DB-specific (JSONB, window functions, CTE), only fails at runtime, must … → **new section (web-vulns has @Query only for injection)** [spring-data]
- [H] spring-data-jpa-query-annotation — paging: `Page<T>` runs an extra `COUNT(*)`; `Slice<T>` skips the count (fetches size+1 for `hasNext`); `List<T>` + `Pageable` no metadata. With `JOIN FETCH` or heavy joins in `@Query` returning `Page`, supply … → **new section (rest#... covers only HTTP params)** [spring-data]
- [M] spring-data-jpa, spring-data-jpa-query-annotation, interview-questions — dynamic filters: `Specification` (`JpaSpecificationExecutor`, compose `where(a).and(b)`, return `null` to skip a predicate) vs Query by Example (probe + `ExampleMatcher`; no … → **new section** [spring-data]
- [M] spring-data-jpa-query-annotation — `Stream<T>` query results: must run inside a transaction and be closed (try-with-resources), otherwise the cursor and connection leak; pair with `org.hibernate.fetchSize` hint for exports. Also … → **new section** [spring-data]
- [H] spring-data-jpa, spring-data-jpa-interview-questions — JPA auditing: `@EnableJpaAuditing`, `@EntityListeners(AuditingEntityListener.class)` on a `@MappedSuperclass`, `@CreatedDate/@LastModifiedDate/@CreatedBy/@LastModifiedBy`, `AuditorAware` bean for … → **new section** [spring-data]
- [H] (batch topic; site touches it via `@PreRemove`, `@PostPersist/@PostLoad` in Persistable, deleteInBatch) — entity lifecycle callbacks `@PrePersist/@PostPersist/@PreUpdate/@PostUpdate/@PreRemove/@PostRemove/@PostLoad`: when each fires (PreUpdate only at … → **new section (same as auditing)** [spring-data]
- [M] hibernate-transactions-performance, jpa-hibernate-lifecycle-methods — second-level cache: shared across transactions, off by default, enabled per entity with `@Cache(usage = READ_ONLY | READ_WRITE | NONSTRICT_READ_WRITE)` + region factory … → **entity-lifecycle#first-level (extend) or new section** [spring-data]
- [M] jpa-hibernate-lifecycle-methods — ID strategy table: IDENTITY (no batching, INSERT at persist), SEQUENCE + `allocationSize` (preferred), TABLE (row-lock serialisation point, never), UUID random v4 (16 bytes, B-tree page splits/fragmentation especially … → **entity-lifecycle#flush or locking#batch** [spring-data]

### equals-hashcode (2)
- [M] spring-boot-interview Q6 — **Lombok traps**: `@Builder` ignores field initializers unless you add `@Builder.Default`. (The `@Data` on entities trap is already in equals-hashcode.) → **`equals-hashcode#write-equals` or `java21#record`** [iq-java]
- [H] java-fundamentals#2: **`double` is wrong for money**. `0.1 + 0.2` gives `0.30000000000000004`, and `new BigDecimal("0.1")` or `BigDecimal.valueOf(0.1)` must be used, never `new BigDecimal(0.1)`. No lesson explains this. The lessons only use `BigDecimal` … → **new section in `equals-hashcode` after `#integer-cache`** [j-lang]

### exception (9)
- [M] java-tricky-core-questions Q2 — **ClassNotFoundException vs NoClassDefFoundError**, including the trap: a static initializer fails, so the first access throws `ExceptionInInitializerError` and later accesses throw `NoClassDefFoundError`. Only appears as … → **`exception#hierarchy` or `java-runtime#classloader`** [iq-java]
- [M] exception-handling-advanced — Logging: `log.error("...{}", id, ex.getMessage())` loses the stack trace and the `Caused by` chain; pass `ex` as the last argument with no placeholder. The meaning of `... N more` (frames shared with the enclosing trace, … → **`exception#spring-design`** [iq-java]
- [H] java-logging-slf4j-stacktrace — **How to log an exception.** Pass the exception as the last argument with no `{}` for it: `log.error("Settle failed orderId={}", id, ex)`. Common mistakes: `log.error("...: {}", ex.getMessage())` drops the stack trace … → **`exception#spring-design` or a new "logging" section** [j-jvm]
- [H] java-logging-slf4j-stacktrace — **Reading a stack trace.** The top block is the outermost wrapper. The deepest `Caused by:` is the root cause. Inside it, scan down to the first frame in your own package to find your line. `... 41 common frames omitted` … → **`exception#spring-design` (a small "read this trace" widget would fit well)** [j-jvm]
- [M] java-logging-slf4j-stacktrace — **Parameterized logging and cost.** `log.debug("x " + obj)` concatenates even when DEBUG is off. `{}` placeholders avoid that, but the arguments are still evaluated (for example `toJson(order)`), so use `if … → **new logging section** [j-jvm]
- [M] java-logging-slf4j-stacktrace — **Log-level policy.** ERROR with the stack trace for unexpected/5xx failures. WARN without a stack trace for 4xx and validation errors, because bots otherwise flood the logs and hide real 500s. INFO for business … → **new logging section (links to `exception#spring-design`)** [j-jvm]
- [M] java-logging-slf4j-stacktrace — **SLF4J is a facade.** Spring Boot uses Logback by default, and bridges (jcl/jul-to-slf4j) route other libraries' logging through it. If no provider is found, SLF4J falls back to a NOP logger and logs disappear. A bridge … → **new logging section** [j-jvm]
- [M] java-logging-slf4j-stacktrace — **`-XX:+OmitStackTraceInFastThrow` (on by default).** After an implicit exception (NPE, AIOOBE, ArithmeticException, ClassCastException) is thrown many times at a hot site, C2 swaps in a preallocated exception with no … → **`exception#spring-design`** [j-jvm]
- [M] java-logging-slf4j-stacktrace — **What makes exceptions expensive.** The cost is `fillInStackTrace()` (walking the stack) at construction, not `throw`. For high-frequency control-flow or business exceptions, use `super(msg, null, false, false)` … → **`exception#spring-design`** [j-jvm]

### index (5)
- [H] mysql-indexing-beyond-equality: **a range column breaks the sort order of the columns after it (the ESR rule: Equality, Sort, Range).** Our `index#composite` only says "`=` columns first, range or sort columns after". It never says what happens when a … → **`index#composite`** [db-perf]
- [M] mysql-indexing-beyond-equality / query-planner: **OR across different columns.** An index `(a, b)` cannot serve `WHERE a = 1 OR b = 2`. You need separate indexes (PostgreSQL `BitmapOr`, MySQL `index_merge`) or a rewrite to `UNION ALL`. No lesson … → **`index#no-index`** [db-perf]
- [M] indexing-query-optimization: **partial index** (`CREATE INDEX ... WHERE status = 'PENDING'`, or `WHERE deleted_at IS NULL` for soft deletes). It is small and cheap to maintain, and works well with low-selectivity status columns, which ties directly into … → **`index#covering` (as a sibling) or a new part** [db-perf]
- [M] mysql-indexing-beyond-equality: **LIMIT does not rescue a bad plan.** `... WHERE rare_condition LIMIT 100` with a Seq Scan stops early only when matches are dense. When matches are sparse it reads most of the table (site: 0.5 ms vs 143 ms on the same … → **`index#no-index`** [db-perf]
- [M] performance-monitoring / advanced-sql: **EXPLAIN (ANALYZE, BUFFERS)**: `shared hit` vs `read`, and `Sort Method: external merge Disk` meaning work_mem is exceeded and the sort spills to disk. Hash Join spill shows as `Batches > 1`. We only use BUFFERS … → **`index#explain`** [db-perf]

### isolation (4)
- [M] postgresql-heap-storage / storage-engines: **PostgreSQL UPDATE writes a new row version and leaves a dead tuple. VACUUM or autovacuum reclaims it, and a long-open transaction (or an idle `BEGIN`) stops VACUUM, so the table and indexes bloat.** InnoDB … → **`isolation#mvcc` (or `isolation#long-tx`)** [db-perf]
- [M] /schema-migrations: **Batch backfill.** Don't run one giant UPDATE: it is a long transaction that holds row locks and bloats undo/dead tuples. Update about 1000 rows per transaction with a short pause between batches. Same new section, and link to … [db-tx]
- [M-H] /isolation-levels "Handling Write Skew" + /acid: **Materialize the conflict.** `isolation#write-skew` says "FOR UPDATE: lock the rows used to check the condition". That is incomplete. (1) PG rejects `SELECT count(*) ... FOR UPDATE` ("FOR UPDATE is not … → **`isolation#write-skew`** [db-tx]
- [M] /isolation-levels (MySQL section) + /transactions-concurrency Q7: **MySQL InnoDB REPEATABLE READ details.** Plain SELECTs read from a snapshot; locking reads, UPDATE and DELETE read the latest committed row ("current read") and take next-key (record + … → **`isolation#levels-table` (REPEATABLE_READ row) + one line in `isolation#lost-update`** [db-tx]

### java-io (1)
- [M] java-io#3-4: **BIO vs NIO (Selector multiplexing) vs AIO** is missing. Our `java-io#bytebuffer` covers Channel and Buffer but not Selector or the I/O models. Interview angle: thread-per-connection (Tomcat classic) vs one event-loop thread watching many … → **new section in `java-io` after `#bytebuffer`, or tie it into the virtual-thread part of `java21`** [j-lang]

### java-runtime (4)
- [M] java-jvm §1 — **`ClassNotFoundException` vs `NoClassDefFoundError`** (very common junior question). The first is checked, thrown by explicit loading (`Class.forName`, `loadClass`) when the class is not found. The second is an Error: the class was there … → **`java-runtime#classloader`** [j-jvm]
- [M] java-graalvm-aot — **GraalVM native image (AOT) vs JIT.** Startup in ms and low RSS, but lower peak throughput (no runtime profile). Closed-world assumption: reflection, dynamic proxies and runtime class loading need metadata (tracing agent). Build-time … → **`java-runtime#jit` (short part)** [j-jvm]
- [M] java-jit-compiler, java-jvm §9 — **JIT is speculative.** It inlines monomorphic calls behind a guard. When a new subtype shows up, it deoptimizes back to the interpreter, which explains latency spikes even after warm-up. OSR compiles long-running loops … → **`java-runtime#jit`** [j-jvm]
- [M] java-interview-questions §5/§8: **ClassNotFoundException vs NoClassDefFoundError**, plus an exception in a static initializer causing `ExceptionInInitializerError` first and `NoClassDefFoundError` on later uses. Our `java-runtime` lists … → **`java-runtime#classloader`** [j-lang]

### java-time (1)
- [M] time-and-ordering — `System.currentTimeMillis()` / `Instant.now()` is a wall clock that NTP can move **backwards**; measure durations and timeouts with `System.nanoTime()` (monotonic, meaningless across machines). Timestamps from two servers (or inside … → **`java-time#clock`** [sd-data]

### java21 (1)
- [H] GZ/java-interview-questions-100, GZ/mock/epam-java-developer-interview-experience, GZ/mock/ibm-java-springboot-interview-3-years: **"What's new in Java 8 / Java 11?"** (asked in 3 of the mocks). Java 8: lambda, Stream, Optional, default/static interface … → **`java21#versions`** [iq-genz]

### jvm (12)
- [H] GZ/mock/wipro-java-springboot-interview-3-years, GZ/java-interview-questions-100, GZ/mock/tcs-ninja-nqt-interview-experience: **JVM vs JRE vs JDK** and **how Java is platform independent** (javac produces bytecode, and each OS has its own JVM that runs … → **`jvm#memory-areas` (short intro part before it) or new section in `java-runtime`** [iq-genz]
- [M] GZ/java-interview-questions-trickiest, GZ/java-interview-questions-100: a memory leak through a **non-static inner class or anonymous class holding `Outer.this`**, and **unclosed resources** (streams, connections). Neither is in the jvm leak list → **`jvm#leak`** [iq-genz]
- [H] java-jvm, java-stack-vs-heap, production-oom-debugging-guide — **JVM process memory = heap + metaspace + thread stacks (≈1 MB × threads) + code cache + direct buffers + JVM overhead.** Classic incident: the pod is OOMKilled (exit 137) while the heap is … → **`jvm#container` / `jvm#investigate`** [j-jvm]
- [H] java-diagnostics-troubleshooting, java-jvm — **CPU 100% runbook.** `top -H -p <pid>` → take the hot TID → `printf '%x'` → find `nid=0x...` in `jcmd <pid> Thread.print`. Take 3 dumps about 5 s apart: the same RUNNABLE frame every time means a hot loop or … → **`jvm#investigate` (or new part "CPU cao")** [j-jvm]
- [H] java-jvm (§13 Reference Types) — **Strong / Soft / Weak / Phantom references.** Soft is cleared under memory pressure (memory-sensitive caches). Weak is cleared at the next GC (`WeakHashMap`, canonical maps). Phantom is post-mortem cleanup with a … → **`jvm#gc-roots` (new part)** [j-jvm]
- [M] java-diagnostics-troubleshooting, java-stack-vs-heap — **Heap-dump analysis vocabulary.** Shallow vs retained heap. Path to GC Roots, excluding weak/soft. Quick first look with `jcmd <pid> GC.class_histogram` (or `jmap -histo:live`) before a full dump. … → **`jvm#investigate`** [j-jvm]
- [M] java-jvm, java-gc — **GC algorithms by generation.** Mark-sweep leaves fragmentation. Mark-compact slides objects. Copying (mark-copy) is used for Young: its cost scales with live objects, not dead ones, which is why Minor GC is cheap. S0/S1 swap … → **`jvm#gc-roots` / `jvm#generational`** [j-jvm]
- [M] java-gc — **Parallel vs concurrent** (a listed interview hook). Parallel = many GC threads but still stop-the-world. Concurrent = GC runs while app threads run. Also the history: Parallel was the JDK 8 default; CMS was deprecated in 9 and removed in 14; … → **`jvm#collectors`** [j-jvm]
- [M] java-jvm, java-gc — **A long STW pause stops TCP handling**, so the k8s liveness probe fails and the pod is restarted even though it was only paused. Ties GC to ops → **`jvm#collectors`** [j-jvm]
- [M] java-classloaders-metaspace, java-jvm §6 — **Metaspace/ClassLoader leak.** A class can be unloaded only when its ClassLoader is unreachable. A ThreadLocal or a pooled thread's context ClassLoader that holds a webapp object pins the whole loader, giving … → **`jvm#oom`** [j-jvm]
- [M] java-jvm, java-stack-vs-heap, java-jit-compiler — **Escape analysis / scalar replacement.** "Do all objects go on the heap?" No: C2 can remove allocations of objects that never escape the method, and can also elide locks (StringBuffer) and coarsen them. … → **`jvm#stack-heap`** [j-jvm]
- [M] java-object-layout-memory, java-jvm — **Object header and compressed oops.** Header is 12 B (mark word 8 + compressed klass 4), and objects are padded to 8 B, so an `Integer` is 16 B vs 4 B for an `int`. Compressed oops let 32-bit references address up … → **`jvm#memory-areas` (new part) or `jvm#collectors`** [j-jvm]

### kafka (32)
- [H] .../core/kafka-overview, .../interview/interview-core (Q2) — "Why is Kafka fast?" is missing entirely: sequential append-only I/O, OS page cache instead of JVM heap cache (small broker heap, no GC pressure, cache survives process restart), zero-copy … → **`kafka#log` (new part, e.g. "Vì sao Kafka nhanh")** [kafka-core]
- [H] .../consumer/consumer-overview, .../core/kafka-producers-consumers, .../interview/interview-producer-consumer (Q13) — `auto.offset.reset` is absent: `earliest` / `latest` (client default, also Spring Boot's default since it does not override it) / … → **`kafka#group` or `kafka#delivery`** [kafka-core]
- [H] .../interview/interview-core (Q14), .../core/kafka-producers-consumers — Replay is claimed in `kafka#log` but never shown how: `kafka-consumer-groups.sh --reset-offsets --to-earliest|--to-offset|--to-datetime` (group must be stopped), `consumer.seek()` … → **`kafka#log` (replay paragraph) or `kafka#delivery`** [kafka-core]
- [H] .../producer/producer-overview, .../core/kafka-producers-consumers — Producer `send()` is async: `KafkaTemplate.send()` returns `CompletableFuture<SendResult>`; fire-and-forget with no `whenComplete` / `ProducerListener` silently loses failed sends once … → **`kafka#producer`** [kafka-core]
- [H] .../interview/interview-producer-consumer (Q6), .../interview/interview-advanced (Q11), .../core/kafka-partitioning-strategies — Retries can reorder messages within a partition when `max.in.flight.requests.per.connection > 1` and idempotence is off; … → **`kafka#producer` (or `kafka#ordering` third trap)** [kafka-core]
- [H] .../consumer/consumer-overview, .../consumer/consumer-group, .../interview/interview-producer-consumer (Q10) — Two liveness timers: `session.timeout.ms` (default 45 s, checked via the background heartbeat thread: process/network death) vs … → **`kafka#group`** [kafka-core]
- [H] .../kafka-vs-rabbitmq, .../consumer/consumer-lag, .../interview/interview-producer-consumer (Q16) — The reason Kafka has no per-message ack/retry: progress is one contiguous committed offset per partition, so a failing record causes head-of-line … → **`kafka#outbox` (Kafka vs RabbitMQ bullet) and `kafka#dlt`** [kafka-core]
- [H] .../consumer/consumer-overview, .../core/kafka-producers-consumers, .../advanced/order-messages — Spring `Acknowledgment` semantics: not calling `ack.acknowledge()` does NOT redeliver the record (consumer position already moved; a later ack commits past … → **`kafka#delivery` (after the AckMode paragraph) or `kafka#dlt`** [kafka-core]
- [M] .../core/replication, .../interview/interview-core (Q5, Q10-Q12), .../kafka-broker — Missing durability pieces: High Watermark (consumers only read up to the offset replicated to all ISR, so they never see data that could vanish on failover), LEO, … → **`kafka#producer` (or `kafka#log` ISR paragraph)** [kafka-core]
- [M] .../interview/interview-advanced (Q1, Q3), .../producer/producer-transactions, .../advanced/kafka-exactly-once — Kafka transactions mechanics are a single sentence in `#delivery`. Missing: `transactional.id` (stable per logical producer), … → **`kafka#delivery` (new part "Kafka transaction")** [kafka-core]
- [M] .../interview/interview-core (Q7), .../core/topic, .../advanced/kafka-log-compaction — `cleanup.policy`: `delete` (retention.ms / retention.bytes, whole closed segments) vs `compact` (keep latest value per key; tombstone = key + null value, kept for … → **`kafka#log`** [kafka-core]
- [M] .../core/kafka-partitioning-strategies, .../interview/interview-core (Q9, Scenario 8), .../producer/hash-key-partitions — Hot partition fixes: high-cardinality key, salting with two-stage aggregation (breaks per-key order, only for commutative … → **`kafka#ordering`** [kafka-core]
- [M] .../interview/interview-core (Q6, Q8), .../core/scaling-partitions, .../core/topic — Partition count sizing (max of throughput/per-partition throughput and target consumer parallelism; "pick generously up front"), cost of over-partitioning (file … → **`kafka#ordering`** [kafka-core]
- [M] .../consumer/consumer-group, .../core/partition (Q3), .../interview/interview-producer-consumer (Q8, Q14) — Rebalance protocols: eager (all partitions revoked, stop-the-world) vs `CooperativeStickyAssignor` (incremental, only moved partitions pause); … → **`kafka#group`** [kafka-core]
- [M] .../advanced/exactly-once-vs-dedup (section 12, Traps 1-3) — Scaling a consumer 1 → 2 pods: (a) a dynamic `group.id` per pod (hostname/UUID) makes every pod read 100% of the topic; (b) keying by entity gives a single-writer lane but is not a correctness … → **`kafka#idempotent-consumer` (add a paragraph) ** [kafka-core]
- [M] .../producer/producer-overview, .../advanced/kafka-performance-tuning, .../interview/interview-advanced (Q12-Q14) — Throughput knobs at junior-mid level: `linger.ms` + `batch.size` (batching, latency trade-off), `compression.type` lz4/zstd (batch-level, … → **`kafka#producer` (short paragraph)** [kafka-core]
- [M] .../interview/interview-core (Q3), .../core/kraft-vs-zookeeper — KRaft vs ZooKeeper one-liner: metadata now in an internal Raft-replicated log on controller nodes (`__cluster_metadata`), ZooKeeper removed in Kafka 4.0; benefits: one system to run, fast … → **`kafka#log`** [kafka-core]
- [M] .../interview/interview-core (Scenario 9), .../kafka-vs-rabbitmq, .../interview/interview-producer-consumer (Q18) — Claim check pattern: default max message ~1 MB (`message.max.bytes` / `max.request.size`); put blobs in object storage and publish a … → **`kafka#log` or `sd-concepts#message-queue`** [kafka-core]
- [H] .../advanced/monitoring-operations — Replaying / resetting offsets is not taught. Lesson says "replay được" (kafka#log) but never how. Site: stop all consumers in the group, then `kafka-consumer-groups.sh --reset-offsets --to-earliest | --to-offset | … → **`kafka#delivery` (or `kafka#log`)** [kafka-ext]
- [H] .../advanced/monitoring-operations — How to check and alert on consumer lag. kafka#dlt defines lag but does not show where to see it. Site: `kafka-consumer-groups.sh --describe --group X` prints CURRENT-OFFSET / LOG-END-OFFSET / LAG per partition. … → **`kafka#dlt` (extend the lag paragraph)** [kafka-ext]
- [M] .../streams/interview-questions Q8, .../streams/production-runbook §4 — Consumer `isolation.level`. Lesson kafka#delivery explains that Kafka transactions commit output and offsets together, but omits that downstream consumers must set … → **`kafka#delivery`** [kafka-ext]
- [M] .../streams/processor-api-dlq §5 — Poison pill / deserialization failure. A record that cannot be deserialized fails before the listener runs, so `@KafkaListener` try/catch never sees it. Site (Streams flavour): the default LogAndFail handler stops the … → **`kafka#dlt`** [kafka-ext]
- [M] .../advanced/monitoring-operations (Log Retention & Compaction) + .../advanced/kafka-connect (compacted internal topics) — Log compaction is absent from all lessons. Content to add: `cleanup.policy=delete` (retention by time/size) vs `compact` (keeps … → **`kafka#log`** [kafka-ext]
- [M] .../streams/interview-questions Q4, .../advanced/kafka-connect (rebalance Q) — Reducing rebalance pain. Lesson kafka#group says only "consumer vào/ra thì rebalance". Missing: - eager (stop-the-world: everyone revokes everything) vs incremental … → **`kafka#group`** [kafka-ext]
- [M] .../advanced/kafka-data-governance §1, .../streams/processor-api-dlq §7 — Event schema evolution. There is no Schema Registry / Avro / compatibility-mode content anywhere. Site: - BACKWARD: consumers using the new schema can read data written with the … → **`kafka` new short part, or extend `microservices#contract-test` (which already teaches expand/contract for REST only)** [kafka-ext]
- [M] event-driven-microservices — Out-of-order events across topics/retries: guard projections with a monotonic entity version (`ON CONFLICT ... DO UPDATE ... WHERE stored.version < EXCLUDED.version`); create a placeholder row if a child event arrives first → **new section or `kafka#ordering`** [sd-msg]
- [H] dead-letter-queue, message-queues — Classify failures before retry/DLT: transient (timeout, 503) -> backoff retry; permanent/poison (bad JSON, schema mismatch, validation) -> `addNotRetryableExceptions` straight to DLT; business failure (insufficient … → **`kafka#dlt`** [sd-msg]
- [M] dead-letter-queue — DLT breaks per-key ordering (TXN-101 to DLT, TXN-102 processed, 101 replayed later). For strict ordering (ledger, balance) pause the container/partition and alert instead of DLT. Spring's recoverer adds origin … → **`kafka#dlt`** [sd-msg]
- [M] dead-letter-queue, cdc, event-driven-microservices — Schema evolution: an event is a public contract; additive optional fields only, never rename/remove/retype; Schema Registry compatibility (BACKWARD = upgrade consumers first). A breaking producer … → **`kafka` new part or `kafka#dlt`** [sd-msg]
- [M] outbox-pattern — Polling relay details: several relay instances use `SELECT ... FOR UPDATE SKIP LOCKED`; do not hold a DB transaction open across `kafkaTemplate.send().get()` (connection pool starvation; one failure rolls back the whole batch and … → **`kafka#outbox`** [sd-msg]
- [M] cdc — CDC as its own idea: log-based (WAL/binlog, Debezium) vs polling `updated_at` (misses hard deletes and intermediate states, adds load); typical uses: sync DB -> Elasticsearch, cache invalidation, outbox engine; ordering only per primary key; … → **`kafka#outbox`** [sd-msg]
- [M] dead-letter-queue, message-queues — RabbitMQ failure handling: manual ack, `basicNack(requeue=true)` returns a poison message to the head (infinite loop), `requeue=false` + queue arg `x-dead-letter-exchange` routes to a DLQ; prefetch limits unacked … → **`kafka#outbox` (RabbitMQ paragraph)** [sd-msg]

### lab-jpa-perf (2)
- [H] scaling-writes — JDBC batch inserts: Spring Boot does not set `spring.jpa.properties.hibernate.jdbc.batch_size`, so `saveAll(10_000)` sends 10,000 separate INSERTs; set `batch_size` (+ `order_inserts`, `order_updates`). With `GenerationType.IDENTITY` … → **`lab-jpa-perf` new section (or `entity-lifecycle#flush`)** [sd-data]
- [M] spring-batch, spring-interview-questions (Q30), spring-boot-interview-questions (Q17) — Junior-mid level points: Job → Step → ItemReader/Processor/Writer; **chunk-oriented processing = one transaction per chunk** (failure rolls back only that chunk); … → **new lesson or a section in `lab-jpa-perf` / `auto-config`** [spring-core]

### lld-1 (3)
- [H] /low-level-design/problem/rate-limiter — The sliding window counter is missing. It keeps 2 counters per client, O(1) memory, and estimates `prevCount * (1 - elapsedFraction) + currCount`. It fixes the fixed-window boundary burst without sliding-log … → **`lld-1#rate-limiter` (one more `way`) or inside `#token-bucket`** [patterns-lld]
- [M] /low-level-design/problem/parking-lot — Where to put the lock. The site puts `synchronized tryPark()` on each spot (fine-grained lock: two cars on different spots don't block each other) and keeps active tickets in a `ConcurrentHashMap`. Our lesson only … → **`lld-1#parking-lot` after** [patterns-lld]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/distributed-rate-limiter — lld-1#rate-limiter and sd-concepts#rate-limit cover fixed window, sliding log, token bucket, Redis+Lua. Missing: **sliding window counter** … → **lld-1#rate-limiter (sliding counter) and sd-concepts#rate-limit (fail-open)** [sd-problems]

### lld-2 (5)
- [M] /low-level-design/problem/movie-ticket — Booking several seats at once, all-or-nothing: try to hold each seat, and if one fails, release the ones already held. Our lesson only does one seat (A1). Also missing: - Model `Seat` (the physical seat) … → **`lld-2#movie-ticket` (new `ask` + after)** [patterns-lld]
- [L-M] /low-level-design/problem/elevator — An explicit state machine (IDLE, MOVING_UP/DOWN, DOOR_OPEN); internal (car button) vs external (hall call + direction) requests; and the multi-elevator dispatcher cost function (distance + penalty for wrong … → **`lld-2#elevator` after** [patterns-lld]
- [M] /low-level-design/problem/inventory-management — Track `total` and `reserved` separately, so `available = total - reserved`. Operations are reserve → confirmSale → release, all atomic per SKU and warehouse, so stock is never oversold. Plus: a low-stock … → **new section (`lld-2` or a future `lld-3`)** [patterns-lld]
- [L-M] /low-level-design/problem/amazon-locker — Best-fit locker (smallest that fits, like parking), a pickup code (should use `SecureRandom`), a periodic expiry job, and result objects instead of exceptions. It reuses ideas we already teach, so it would … → **`lld-2#ghep-pattern` drill item or new section** [patterns-lld]
- [H] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/ticketmaster — **Ticket booking with seat hold TTL at service level**. lld-2#movie-ticket does it in-process (ConcurrentHashMap.compute); no DB/Redis version. Site: hold = … → **new section in sd-practice, or a part linking lld-2#movie-ticket to sd-practice#checkout** [sd-problems]

### locking (4)
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/job-scheduler — **Distributed job scheduler / worker claiming**. locking#locks-pessimistic mentions SKIP LOCKED in one sentence; sd-concepts mentions ShedLock. Missing: claim … → **new section in sd-practice, cross-link locking#locks-pessimistic and redis-patterns#lock (fencing token already there)** [sd-problems]
- [M] hibernate-association-best-practices — unidirectional `@OneToMany` without `@JoinColumn` creates a join table (INSERT child, INSERT link); with `@JoinColumn` still extra UPDATE to set the FK; prefer `@ManyToOne` (+ `mappedBy` if needed). Ours says … → **locking#mapping** [spring-data]
- [M] hibernate-association-best-practices — `CascadeType.REMOVE`/orphan removal on a big collection loads every child and issues one DELETE each (needed to fire `@PreRemove`); for large sets run a bulk delete first. Also: don't map huge to-many collections … → **locking#mapping** [spring-data]
- [M] spring-data-jpa-interview-questions — MySQL needs `rewriteBatchedStatements=true` in the JDBC URL or JDBC batches are still sent row by row → **locking#batch** [spring-data]

### microservices (20)
- [M] api-design — **REST vs gRPC vs GraphQL comparison.** GraphQL is not covered anywhere (grep finds 0 hits). The site has a comparison table: transport, payload format, contract (OpenAPI vs .proto vs SDL), over-fetching and under-fetching, browser support … → **new section in rest (or extend microservices#communication, which mentions gRPC in only one line)** [sd-arch]
- [M] load-balancing-reliability + sidecar-pattern — **Graceful shutdown on deploy.** On SIGTERM, Kubernetes removes the pod from endpoints in parallel, not first, so new requests still arrive for a second or two. Fix: `server.shutdown=graceful` (the default … → **microservices#deployment** [sd-arch]
- [M] domain-driven-design + service-decomposition — **DDD tactical vocabulary.** Interviewers often ask "what is DDD?" and expect more than the term bounded context. Missing pieces: entity (identity) vs value object (immutable, equal by value); aggregate as … → **microservices#boundaries (a new DDD part)** [sd-arch]
- [M] service-decomposition / domain-driven-design — **Concrete bounded-context example: the same word means different things.** "Order" in Checkout = payment and line items; in Shipping = weight, parcel, and tracking; in Billing = tax and invoice. This is … → **microservices#boundaries** [sd-arch]
- [M] reverse-proxy-load-balancer-api-gateway / service-mesh — **API gateway vs service mesh: north-south vs east-west traffic.** The gateway handles external clients (JWT, API keys, per-client rate limits, protocol translation). The mesh handles … → **microservices#api-gateway** [sd-arch]
- [H] architecture-fundamentals Q&A, 60-days Day 53 — Zero-downtime DB schema change under rolling deploy: old and new code run against the same schema at once, so never rename/drop a column in one release. Steps: add new column (nullable) -> write both -> … → **`microservices#deployment` (or `db-design` migration cheat expanded)** [sd-general]
- [M] 60-days Day 14, senior-engineer-design-course — Feature flags: decouple deploy from release, kill switch faster than rollback, flag debt. Absent everywhere → **`microservices#deployment`** [sd-general]
- [H] two-phase-commit, distributed-transactions — How 2PC actually works: phase 1 PREPARE (participant writes undo/redo to WAL, keeps locks, votes YES and may no longer abort on its own), coordinator durably logs COMMIT (point of no return), phase 2 … → **`microservices#distributed-data`** [sd-msg]
- [M] saga-pattern, distributed-transactions — Orchestrator must persist saga state (state table with allowed transitions, `@Version`) before calling participants; a recovery job re-drives sagas stuck in a non-terminal state; every step has a timeout. … → **`microservices#distributed-data`** [sd-msg]
- [M] distributed-transactions — Saga isolation anomalies beyond semantic lock: lost update between a user cancel and an in-flight step (guard with version check), commutative updates → **`microservices#distributed-data`** [sd-msg]
- [H] cqrs, event-driven-microservices — CQRS beyond one line: write model (normalized, enforces invariants) vs read model (denormalized projection built from events, e.g. into Elasticsearch); CQRS does not require event sourcing; try read replica + cache … → **new section** [sd-msg]
- [M] event-driven-microservices, cqrs — Event styles: event notification (thin, consumers call back, reintroduces sync coupling and load), event-carried state transfer (fat, consumers autonomous, schema becomes a contract), event sourcing. Don't publish JPA … → **new section (or `microservices#communication`)** [sd-msg]
- [M] cqrs — Event sourcing basics: store events, rebuild state by replay; snapshot every N events; events are immutable so versioning/upcasters; optimistic concurrency on expected stream version; use for ledgers/audit, not by default. Not mentioned anywhere … → **new section** [sd-msg]
- [H] deployment-strategies, blue-green-deployment — **Expand-contract for DB schema during rolling/blue-green.** The lesson only does this for JSON fields. Both versions share one DB, so a `RENAME COLUMN` or `DROP COLUMN` breaks v1 (still running, or needed … → **`microservices#deployment` (or `db-design` migration row expanded)** [sd-ops]
- [H] deployment-strategies — **Feature flags / kill switch are missing everywhere** (no "feature flag/toggle" anywhere). They separate deploy from release, can switch a feature off in seconds without a redeploy, and work with trunk-based development. Types: … → **`microservices#deployment` (new bullet/part) ** [sd-ops]
- [M] deployment-strategies — **Zero-downtime mechanics in Spring/K8s.** The readiness probe gates traffic during a rolling update: missing readiness is the #1 cause of errors during deploys. `maxSurge/maxUnavailable`. Graceful shutdown: … → **`microservices#deployment` (link to auto-config#actuator for probes)** [sd-ops]
- [M] deployment-strategies, blue-green-deployment — **Deployment comparison gaps.** Rollback speed (blue-green instant, rolling slow), Recreate (has downtime; only when v1/v2 cannot coexist), Shadow/dark launch (mirror traffic and discard responses; must not … → **`microservices#deployment`** [sd-ops]
- [M] contract-testing — **Contract test detail is thin/slightly confusing.** The lesson says the consumer test uses WireMock. With Pact the consumer test runs against a Pact mock server generated from the contract; with SCC the consumer uses stubs generated … → **`microservices#contract-test`** [sd-ops]
- [M] distributed-tracing, observability — **Custom spans and span model.** Parent/child spans (spanId, parentSpanId). Add a business span with the `Observation` API / `@Observed` (or `tracer.nextSpan()...end()` in finally). Tag spans with ids, never PII. … → **`microservices#observe-ship`** [sd-ops]
- [M] distributed-tracing, opentelemetry-sampling-strategies — **Head vs tail sampling.** The lesson only says "Boot samples 10%". Head sampling decides at the first hop, blindly: at 1% sampling and a 0.1% error rate, you almost never keep the failing trace. … → **`microservices#observe-ship` (one paragraph)** [sd-ops]

### mvc-flow (1)
- [M] GZ/mock/cognizant-java-developer-interview-3-years, GZ/mock/paytm-java-developer-interview-first-round, GZ/spring-boot/spring-boot-tricky-interview-questions-4: **Spring WebFlux vs MVC**: event loop on Netty, `Mono` vs `Flux`, R2DBC so the whole stack … → **new section in `mvc-flow` (contrast with the thread-per-request flow)** [iq-genz]

### n-plus-one (3)
- [H] spring-data-jpa, spring-data-jpa-query-annotation — projections: closed interface projection (`List<UserSummary> findByStatus(...)` → selects only declared columns), open projection with `@Value("#{target.a + ' ' + target.b}")` (loads full entity, no … → **new section** [spring-data]
- [M] spring-data-jpa-interview-questions — plain `select o from Order o join o.items` only filters, it does **not** initialise `items`; you still get N+1. Only `join fetch`/EntityGraph populate the collection. Common trick question; not stated in ours → **n-plus-one#n-plus-one** [spring-data]
- [M] spring-data-jpa-query-annotation (site gets it wrong) — `@EntityGraph` on a **collection** + `Pageable` hits the same HHH90003004 in-memory paging as JOIN FETCH (it is a fetch join). Ours names only JOIN FETCH in the trap. Also mention `countQuery` for … → **n-plus-one#traps** [spring-data]

### oauth2-oidc (5)
- [M] security-patterns — **JWT vs opaque token + introspection is missing.** JWT: verified locally with JWKS, cannot be revoked before `exp` without a denylist, claims go stale. Opaque: the resource server calls `/introspect` (Spring `opaqueToken()` / … → **`oauth2-oidc#tokens` or `security#tokens`** [sd-ops]
- [H] S/jwt-oauth2-oidc-deep-dive §5.1, S/keys-signing-tls (custom validators) — **What Spring's resource server actually validates by default**: signature, `exp`/`nbf` (60 s clock skew by default) and `iss` when `issuer-uri` is set; **`aud` is NOT checked … → **`oauth2-oidc#jwt-validate` (`after`)** [sec-solid]
- [M] S/jwt-oauth2-oidc-deep-dive §2.2/§3.2, S/authentication-authorization (state/PKCE/nonce table) — **OIDC `nonce`**: client puts random nonce in /authorize, IdP embeds it in the signed ID token, client checks it (ID-token replay). Plus the 3-way table … → **`oauth2-oidc#pkce` (after) or `#flow`** [sec-solid]
- [M] S/refresh-token-security-invalidation (Trap 3, cheat sheet), S/cookies-vs-sessions-vs-jwt (schema) — **Store refresh tokens hashed** (SHA-256 of a 32-byte SecureRandom value) like API keys: a DB leak must not yield usable tokens. Schema with … → **`oauth2-oidc#rotation`** [sec-solid]
- [M] S/refresh-token-security-invalidation (Traps 1-2) — **False-positive reuse detection**: mobile retry after a dropped response, or several SPA tabs refreshing with the same R1 at once, look like theft and log the user out. Fixes: short grace window … → **`oauth2-oidc#rotation` (trap or after)** [sec-solid]

### oop (11)
- [H] GZ/java-interview-questions-100, GZ/mock/hcl-java-developer-interview-experience, GZ/java-oops-interview-guide: **the 4 access modifiers table** (private / default / protected / public by class, package, subclass, world). Add the tricky nuance: a … → **`oop#encapsulation`** [iq-genz]
- [H] GZ/java-interview-questions-trickiest, GZ/java-interview-questions-100, GZ/mock/paytm-java-developer-interview-first-round, GZ/mock/wipro-java-springboot-interview-3-years: **the `static` keyword family**: - static fields and methods - a static block … → **new section in `oop` (after `override-rules`)** [iq-genz]
- [M] GZ/java-interview-questions-trickiest, GZ/mock/epam-java-developer-interview-experience, GZ/mock/wipro-java-springboot-interview-3-years: **`public static void main(String[] args)` explained word by word**. Can it be overloaded? Yes, but the JVM only … → **same new `oop` static section** [iq-genz]
- [M] GZ/java-oops-interview-guide, GZ/mock/wipro-java-springboot-interview-3-years (snippet 3), GZ/java-interview-questions-trickiest: **constructor rules**: - the default no-arg constructor disappears once you declare a parameterised one, so `new X()` stops … → **new section in `oop` (or `oop#inheritance-basics`)** [iq-genz]
- [M] GZ/java-interview-questions-trickiest: **how overload resolution picks a method**: phase 1 exact or widening, phase 2 boxing, phase 3 varargs, then the most specific wins. A classic trick question is `m(long)` vs `m(Integer)` called with an int. … → **`oop#override-vs-overload`** [iq-genz]
- [M] GZ/java-oops-interview-guide: **Association vs Aggregation vs Composition** (lifecycle ownership: Doctor-Patient, University-Professor, House-Room) and **cohesion vs coupling**. Neither term exists in `oop` or `solid`; `oop#inheritance` covers … → **`oop#inheritance` or `solid#srp`** [iq-genz]
- [H] grokking part-5 — **Type erasure**: `T` becomes its bound/Object; compiler adds casts and bridge methods; so no `new T()`, no `instanceof List<String>`, and `List<String>`/`List<Integer>` are the same class at runtime → **new section (best home: `oop` new section after `interface-vs-abstract`, or a small new `generics` lesson)** [iq-java]
- [M] java-interview-questions Q17 — **Overload resolution order**: exact match, then widening, then boxing, then varargs (`show(long)` wins over `show(Integer)` for an `int` argument). No lesson has it (grep "varargs|widening" finds nothing) → **`oop#override-vs-overload`** [iq-java]
- [M] java-interview-questions Q13/Q14 — **Fields are not polymorphic** (`Parent ref = new Child(); ref.value` reads the Parent field), plus field hiding and local-variable shadowing (`this.name`, `super.name`). Lessons only cover static method hiding → **`oop#override-rules` (next to the static-hiding note)** [iq-java]
- [H] java-fundamentals#6, java-interview-questions §1: **generics are missing from every lesson.** Interview staples: - why generics exist (type checks at compile time, no casts); - wildcards `<?>`, `<? extends T>` and `<? super T>`, with PECS ("Producer … → **new section in `oop` after `#abstraction`, or a small new `generics` lesson** [j-lang]
- [M] java-interview-questions §1: **inner class types** are missing: non-static inner, static nested, local and anonymous. Key interview point: a non-static inner class (and an anonymous class) holds a hidden reference to the outer instance, which causes … → **new short section in `oop` near `#encapsulation`, or `jvm#leak` for the leak angle** [j-lang]

### patterns-behavioral-1 (1)
- [L-M] /design-patterns/observer — Observer (in-process, the subject calls listeners directly) vs Pub/Sub (a broker sits in between, e.g. Kafka). The site maps this to "Observer → event-driven architecture plus outbox". Our patterns lesson doesn't draw this … → **`patterns-behavioral-1#observer` after** [patterns-lld]

### patterns-creational (6)
- [M] break-singleton-java, java-tricky-core-questions — **`readResolve()`** as the fix for the serialization attack on a non-enum singleton (lesson shows the attack and says "use enum", but never the classic fix). Also the **clone attack** (`Cloneable` … → **`patterns-creational#singleton`** [iq-java]
- [M] /design-patterns/singleton — How to fix the break, not just show it. Our lesson shows that Holder plus `Serializable` gives a new instance after deserialize, and that reflection makes a second one. It never names the fixes: `private Object readResolve() … → **`patterns-creational#singleton` (add to the Holder/enum `ask` or `after`)** [patterns-lld]
- [M] /design-patterns/singleton — "Singleton vs static utility class": a singleton can implement an interface, be passed and injected, be mocked, and be lazy. A static class can do none of these. We never compare them → **`patterns-creational#singleton` (after / cheatsheet line)** [patterns-lld]
- [M] /low-level-design/design-patterns/creational — A singleton is unique per JVM/ClassLoader, not per cluster. Example: 10 pods each run an "invoice-number singleton" and produce duplicate numbers. Fix: DB sequence, Redis `INCR`, or a distributed lock. Our … → **`patterns-creational#singleton` trap or after** [patterns-lld]
- [M] /design-patterns/factory-method + abstract-factory — In Spring, every `@Bean` method in a `@Configuration` is a factory method, and `@Profile` choosing a whole set of beans (Redis+Kafka vs in-memory) works like an Abstract Factory. We cover the JDK … → **`patterns-creational#factory-method` after; one line in `#abstract-factory` after** [patterns-lld]
- [L-M] /low-level-design/design-patterns/creational — Lombok `@Builder` trap: a field initializer (`List<Item> items = new ArrayList<>()`) is ignored by the builder, so the field is `null` unless you use `@Builder.Default` or `@Singular`. This is a common … → **`patterns-creational#builder` trap or after** [patterns-lld]

### patterns-structural (3)
- [M] /design-patterns/adapter — Class adapter (extends the adaptee) vs object adapter (composition, preferred). This is an explicit interview question and is not in our lessons → **`patterns-structural#adapter` after** [patterns-lld]
- [M] /low-level-design/design-patterns/structural — "Big 4" table comparing Adapter, Facade, Decorator and Proxy by interface change, intent, what is wrapped, and a JDK/Spring example. We already compare Adapter vs Decorator (trap) and Decorator vs Proxy … → **`patterns-structural#cheatsheet` (add a quiz or table)** [patterns-lld]
- [M] /low-level-design/problem/file-system — Composite applied end to end: path resolution (`/a/b/../c`, `.`), recursive size and delete, find by name/extension, and Visitor for new operations. We have a Composite folder-size example in patterns-structural … → **new section (`lld-3`), linking `patterns-structural#composite`** [patterns-lld]

### redis (9)
- [H] redis/redis-interview-questions — `@CacheEvict` inside a `@Transactional` method evicts **before commit**: a concurrent reader misses, reads the old committed row and re-caches stale data until TTL. Fix: … → **`redis#invalidation`** [redis-api-test]
- [M] redis/redis-performance-patterns, redis-interview-questions — Hot key ≠ stampede: hit ratio 99% yet latency rises (500 KB value × 10k rps saturates NIC; all QPS on one cluster shard; O(N) command on a big key). Fixes: L1 Caffeine with 2-5 s TTL, … → **`redis#incidents` (new part)** [redis-api-test]
- [M] redis/redis-pubsub — L1 invalidation over Pub/Sub is lossy: an instance restarting during a deploy misses the message and serves stale L1 data until TTL; so L1 TTL is the correctness backstop, Pub/Sub only shortens staleness. Lesson recommends pub/sub … → **`redis#local-vs-redis`** [redis-api-test]
- [M] redis/redis-distributed-cache — Cache pattern vocabulary: read-through, write-through, write-behind, write-around, refresh-ahead (probabilistic early refresh). `sd-concepts#cache-queue` has only write-through/behind → **`redis#cache-aside` (one compact list)** [redis-api-test]
- [H] caching-strategies + scaling-reads — Evict must happen **after commit**. The site's own cache-aside code calls `cache.evict()` inside `@Transactional` (before commit): a reader that misses between the evict and the commit reloads the still-old committed … → **`redis#invalidation`** [sd-data]
- [M] scaling-reads — Delete-after-write can be re-poisoned by a **lagging read replica**: the next miss loads from a replica that has not applied the write and puts the old value back. This is the real reason for the "sleep" in delayed double delete (sleep ≥ … → **`redis#invalidation` (link to `sd-concepts#data`)** [sd-data]
- [M] caching-strategies — Redis is a network hop (~0.5–1 ms RTT), not "RAM speed": 100 `GET`s in a loop ≈ 50 ms. Use `MGET` / `opsForValue().multiGet()` or pipelining (`executePipelined`), and note pipelining is not atomic (Lua is). No lesson mentions MGET … → **`redis#local-vs-redis` (or `redis-structures#string-incr`)** [sd-data]
- [M] caching-strategies — Bloom filter mechanics are only one line today. Missing: k hash functions set k bits in an m-bit array; any 0 bit ⇒ "definitely not"; all 1 ⇒ "maybe" (false positive, never false negative); cannot delete (counting Bloom filter can); … → **`redis#incidents` (part) or `sd-concepts#cache-traps`** [sd-data]
- [M] caching-strategies — Caffeine options interviewers ask about: `expireAfterWrite` (absolute TTL) vs `expireAfterAccess` (sliding, e.g. sessions) vs `refreshAfterWrite` (refresh-ahead: serves old value while reloading one key in background, prevents … → **`redis#local-vs-redis`** [sd-data]

### redis-patterns (12)
- [H] redis/redis-pipeline-transactions, redis-lua-scripting — Pipelining is missing entirely: batches N commands in 1 RTT (1000 SETs at 1 ms RTT ≈ 2 s sequential vs a few ms pipelined), **not atomic**, commands must not depend on each other; Spring … → **`redis-patterns#atomic`** [redis-api-test]
- [M] redis/redis-pipeline-transactions — MULTI nuance: a queue-time error (wrong arity/unknown command) makes EXEC abort the whole block (EXECABORT); only runtime errors (WRONGTYPE) let the others run. The lesson shows only the runtime case → **`redis-patterns#atomic`** [redis-api-test]
- [M] redis/redis-lua-scripting — Lua practicals: writes done before a script error are not rolled back; keep scripts short (blocks the server, `lua-time-limit`, `SCRIPT KILL`); `SCRIPT LOAD` + `EVALSHA` (Spring `DefaultRedisScript` does this); in Cluster all … → **`redis-patterns#atomic`** [redis-api-test]
- [M] redis/redis-distributed-lock — Redisson specifics often asked: `lock()`/`tryLock(wait)` without leaseTime enables the watchdog (default 30 s lease, renewed every ~10 s); passing an explicit leaseTime (`tryLock(5, 30, SECONDS)`) **disables** the … → **`redis-patterns#lock`** [redis-api-test]
- [M] redis/redis-distributed-lock, redis-interview-questions — Redlock (majority of N independent nodes) and Kleppmann's critique: GC pause / clock jump; "efficiency lock vs correctness lock"; concrete fencing token flow (INCR counter returned with lock, … → **`redis-patterns#lock` (trap/after)** [redis-api-test]
- [M] redis/redis-ttl-expiry — TTL gotchas: plain `SET` on an existing key **removes** its TTL (use `KEEPTTL` or re-set EX); `INCR`/`HSET` keep TTL; `EXPIRE` on a missing key returns 0 silently; `TTL` returns -2 for missing key vs -1 no expiry; `GETDEL` for … → **`redis-patterns#eviction` (after)** [redis-api-test]
- [M] redis/redis-eviction-policies — `volatile-*` policies behave like `noeviction` when keys have no TTL (OOM on writes); LRU/LFU are approximated by sampling (`maxmemory-samples 5`); eviction (memory) vs expiration (time) vs invalidation (data changed) … → **`redis-patterns#eviction`** [redis-api-test]
- [M] redis/redis-as-database, redis-interview-questions — Persistence detail: AOF `appendfsync always/everysec/no` and max loss (~1 s for everysec), RDB `BGSAVE` uses fork + copy-on-write (latency spike, up to 2x memory under heavy writes), hybrid … → **`redis-patterns#ha`** [redis-api-test]
- [M] redis/redis-clustering-replication — Split-brain loss when old master keeps taking writes during partition, mitigated by `min-replicas-to-write`/`min-replicas-max-lag`; `WAIT n timeout` (best-effort, not synchronous replication); `MOVED` vs `ASK`; … → **`redis-patterns#ha` (cheat rows)** [redis-api-test]
- [M] redis/redis-rate-limiting — Missing algorithms/ops: sliding window **counter** (weighted prev+current window, two integers, good default), leaky bucket (smooth output, queue) vs token bucket (allows bursts); fail-open vs fail-closed when Redis is down … → **`redis-patterns#rate-limit` (or `sd-concepts#rate-limit`)** [redis-api-test]
- [M] redis/redis-overview — Redis vs Memcached (data structures, persistence, replication/cluster, pub/sub/Lua vs plain strings, client-side sharding). Common junior opener → **`redis-patterns#ha` cheat row (or `redis-structures` intro)** [redis-api-test]
- [M] sharded-counters — **Hot counter.** A single row `UPDATE ... SET likes = likes + 1` serializes on one row lock, which the site estimates at about 1k-5k writes/s, and every update also leaves a dead tuple. A single Redis key sits on one thread. Two … → **redis-patterns#atomic (new part) or sd-concepts#cache-queue** [sd-tech]

### redis-structures (7)
- [H] redis/redis-overview, redis-interview-questions — "Why is Redis fast though single-threaded?": in-memory, I/O multiplexing event loop (epoll), single-threaded command execution so no locks/context switches, simple compact structures; Redis 6+ io-threads … → **new intro section in `redis-structures` (before `string-incr`)** [redis-api-test]
- [M] redis/redis-performance-patterns — Never `KEYS pattern` in production (O(N), blocks); use `SCAN` cursor (`ScanOptions` in Spring). Only `HSCAN` appears today → **`redis-structures#hash` trap or new intro section** [redis-api-test]
- [M] redis/redis-data-types, redis-interview-questions — Reliable List queue: `BLPOP`/`BRPOP` blocking pop (no polling), `LMOVE`/`BRPOPLPUSH` to a processing list then `LREM` on success, reaper re-queues stuck items. Lesson says List loses the job on crash … → **`redis-structures#stream` (after)** [redis-api-test]
- [M] redis/redis-streams, redis-advanced-data-structures — Stream operations: `XREAD` does not delete, so trim with `XADD ... MAXLEN ~ N` / `XTRIM MINID`; recover a dead consumer's pending messages with `XAUTOCLAIM`/`XCLAIM` (idle time); delivery count > N → … → **`redis-structures#stream`** [redis-api-test]
- [M] redis/redis-data-types, redis-advanced-data-structures — Bitmap: `SETBIT`/`GETBIT`/`BITCOUNT`/`BITOP AND` for DAU and retention (1M users ≈ 125 KB); requires dense integer ids (sparse offset allocates huge string) → **`redis-structures#counting` (third option)** [redis-api-test]
- [H] real-time-updates — **Scaling WS/SSE across instances.** Connections live on one node, so user A on node 1 cannot reach user B on node 2. Fix with a pub/sub backplane (Redis Pub/Sub, Kafka, RabbitMQ STOMP relay) where every node delivers to its local … → **same new section (link to redis-structures#stream)** [sd-ops]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/top-k , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/strava — **Top-K over a time window**: redis-structures#zset covers an all-time … → **redis-structures#zset** [sd-problems]

### rest (11)
- [M] GZ/spring-boot/spring-boot-tricky-interview-questions-2, GZ/spring-boot/scenario-based-springboot-interview-questions: **file upload**: `MultipartFile`, `spring.servlet.multipart.max-file-size`, stream to object storage (S3/MinIO) instead of local disk … → **new section in `rest` (or `mvc-flow#request-data`)** [iq-genz]
- [M] api-design/resource-modeling-http-semantics — Long-running operations: `202 Accepted` + `Location: /operations/{id}` + `Retry-After`, poll status (PENDING/RUNNING/SUCCEEDED/FAILED), optional webhook; never hold a request for minutes (LB timeouts 30-60 … → **`rest#status` (after) or new section** [redis-api-test]
- [M] api-design/errors-pagination-filtering — Cursor pagination as an API contract: opaque (signed/validated) cursor, `limit+1` to compute `hasMore` without `COUNT(*)`, response `{items, nextCursor, hasMore}`, avoid exposing totalCount on huge tables. Lesson … → **`rest#paging`** [redis-api-test]
- [M] api-design/resource-modeling-http-semantics — PATCH formats: JSON Merge Patch (`application/merge-patch+json`, `null` clears a field) vs JSON Patch (op list); in Java you cannot tell "absent" from "null" without `JsonNullable`/`Optional` → **`rest#resource`** [redis-api-test]
- [M] api-design/versioning-evolution — Evolution toolkit: tolerant reader for enums (`READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE` + `@JsonEnumDefaultValue UNKNOWN`), expand-contract rename, `Deprecation`/`Sunset` headers, remove with `410 Gone`; changing … → **`rest#versioning`** [redis-api-test]
- [M] api-design/naming-conventions — Data formats: money as `BigDecimal`/string or integer minor units + currency, never float; ids as opaque strings (auto-increment ids leak counts and invite enumeration/IDOR); timestamps RFC 3339 UTC (`createdAt`); enums … → **`rest#dto`** [redis-api-test]
- [M] api-design/api-design-interview-questions — Richardson maturity / HATEOAS: what it is and pragmatic use (pagination `next` links, allowed actions). Zero mentions in lessons; common junior question → **`rest#resource` (one paragraph)** [redis-api-test]
- [M] api-design — **Real-time push: polling vs long polling vs SSE vs WebSocket.** We have nothing on this (WebSocket only appears incidentally in bean-lifecycle). The site table covers direction, latency, and use cases: SSE is one-way from server to client … → **new section in rest** [sd-arch]
- [M] api-design — **Cursor pagination as an opaque token, and why offset breaks under concurrent inserts.** If rows are inserted while a client pages, offset pages repeat or skip rows. The fix is a Base64 cursor that encodes (created_at, id) and a `WHERE … → **rest#paging** [sd-arch]
- [H] long-running-tasks — **Async job pattern is missing.** Anything slower than about 2 s (report, export, transcode) should not hold an HTTP thread. Steps: `POST` → persist job (PENDING) → `202 Accepted` + `Location: /jobs/{id}` (+ `Retry-After`) → client … → **`rest#status` (add 202 bullet) + new section `rest#async-job` (or `sd-practice` new section)** [sd-ops]
- [M] long-running-tasks — **Do not hammer the DB with polling.** Use a growing `Retry-After`, keep transient progress in Redis rather than the DB, and cache terminal states. Switch to SSE only when push is needed → **same new section** [sd-ops]

### sd-concepts (51)
- [M] query-planner-optimizer / antipatterns: **table partitioning in practice**: - partition pruning only works when WHERE filters the partition key directly (`YEAR(created_at)=2024` disables it); - retiring old data with `DROP` or `DETACH PARTITION` instead … → **`sd-concepts#sharding` or `db-design#bang-nho`** [db-perf]
- [M] .../interview/interview-core (Scenario 1, Scenario 7), .../kafka-vs-rabbitmq — "What if Kafka goes down?" answer frame: RF 3 across AZs + `acks=all`/min ISR 2 so a broker loss is a leader failover, consumer crash = rebalance and resume from committed … → **`sd-concepts#message-queue`** [kafka-core]
- [M] redis/redis-session-management — Spring Session with Redis: `spring-session-data-redis`, `@EnableRedisHttpSession`/`spring.session.timeout`, sticky session vs central store, force logout all devices via … → **`sd-concepts#scale` (after) or new part in `redis`** [redis-api-test]
- [H] reverse-proxy-load-balancer-api-gateway + load-balancing-reliability — **Load-balancing algorithms.** Round robin, weighted RR, least connections, IP hash, and random. Rule of thumb: use least connections for long or uneven requests and WebSockets; IP … → **sd-concepts#scale-proxy** [sd-arch]
- [M] reverse-proxy-load-balancer-api-gateway — **X-Forwarded-For / X-Forwarded-Proto.** Behind a proxy or LB, the app sees the proxy's IP. The proxy adds forwarding headers, and the app must trust them only from the proxy, because clients can spoof the … → **sd-concepts#scale-proxy (and a cross-reference from #rate-limit)** [sd-arch]
- [M] load-balancing-reliability — **Sticky sessions trade-offs.** Pinning works by cookie or by IP hash. Downsides: uneven load, sessions lost when an instance dies, and you can't freely scale in or restart instances. The preferred fix is moving session data … → **sd-concepts#scale** [sd-arch]
- [M] rate-limiting-algorithms — **Leaky bucket and sliding window counter.** Leaky bucket is a FIFO queue drained at a constant rate (traffic shaping), used to protect a DB or stay under a provider's rate limit. Sliding window counter estimates `prev × (1 − … → **sd-concepts#rate-limit (summary table) or lld-1#token-bucket** [sd-arch]
- [M] rate-limiting-algorithms — **Fail-open vs fail-closed when Redis is down.** If the shared limiter store is unreachable, rejecting everything turns a cache blip into a full outage. Usual answer: short timeout plus a circuit breaker, then fall back to a … → **sd-concepts#rate-limit** [sd-arch]
- [M] strangler-fig-pattern / domain-driven-design — **Anti-Corruption Layer.** A translation adapter between a new service and a legacy or external model, so legacy names and schemas don't leak in. Other strangler details are missing too: migrate read-only … → **sd-concepts#microservices (or microservices#boundaries)** [sd-arch]
- [H] consistent-hashing-deep-dive + sharding-partitioning — **Virtual nodes** are missing. With one point per node the arcs are uneven, and when a node dies its whole arc falls onto one neighbour. Each physical node gets many points (e.g. 100–256): even … → **`sd-concepts#sharding`** [sd-data]
- [H] sharding-partitioning + scaling-writes — Shard-key rules beyond "query without key hits all shards": (1) high cardinality + even spread; (2) **monotonic keys (timestamp, auto-increment) in range sharding send all new writes to the last shard** (hot … → **`sd-concepts#sharding`** [sd-data]
- [M] sharding-partitioning + time-and-ordering — Unique IDs once sharded: each shard's `AUTO_INCREMENT` restarts at 1 → collisions. Options: Snowflake 64-bit (1 sign + 41-bit ms timestamp + 10-bit worker id + 12-bit sequence = 4096 ids/ms/worker; needs … → **`sd-concepts#sharding` (or new part; link `index` and `sd-practice#shortener-code`)** [sd-data]
- [M] caching-strategies + scaling-reads — **Hot key** is a fourth trap distinct from stampede: hit ratio is ~100% but one key (celebrity profile, flash-sale item) saturates the single Redis node/slot that owns it. Fixes: L1 near-cache with 1–5 s TTL in each … → **`sd-concepts#cache-traps` (add a 4th row) or `redis#incidents`** [sd-data]
- [M] caching-strategies + scaling-reads — Pattern names that interviews ask for are incomplete: **read-through** (the cache/loader fetches on miss, e.g. Caffeine `LoadingCache`; `@Cacheable` behaves this way from the caller's view), **write-around** (write … → **`sd-concepts#cache-queue`** [sd-data]
- [M] caching-strategies — Caching is not always a win: each miss adds the cache round trips (read + write ≈ +2 ms). Site derives break-even hit ratio ≈ 2/(T_db+1): a 2 ms indexed query needs ~67% hits just to break even; a 50 ms join needs ~4%. Interview … → **`sd-concepts#cache-queue`** [sd-data]
- [M] caching-strategies + scaling-reads — HTTP/CDN layer details: `Cache-Control: private` for per-user responses (otherwise a shared CDN can serve user A's page to user B), `s-maxage` (CDN) vs `max-age` (browser), `stale-while-revalidate`; static assets use … → **`sd-concepts#cache-queue`** [sd-data]
- [M] cap-theorem + data-consistency — **PACELC**: even without a partition, every replicated write chooses Latency vs Consistency (wait for replica ack or not). Ties directly to our sync vs async replication paragraph; one sentence plus the name is enough → **`sd-concepts#cap`** [sd-data]
- [M] cap-theorem + data-consistency — Consistency vocabulary: linearizable (CAP's C) vs eventual, plus session guarantees: read-your-writes (we have), **monotonic reads** (count goes 1423 → 1419 → 1425 when the LB round-robins replicas with different lag; … → **`sd-concepts#cap`** [sd-data]
- [M] split-brain + cap-theorem — Split-brain: a partition or long GC pause makes the old primary keep accepting writes while a replica is promoted (GitHub 2018: 43 s partition → 24 h recovery). Defences: majority quorum (only one side can have ⌊N/2⌋+1, hence … → **`sd-concepts#cap` (concept) and `redis-patterns#ha` (Sentinel quorum line)** [sd-data]
- [M] data-consistency + scaling-reads — How to actually implement "read primary right after a write": a per-user flag (Redis key / session) for a few seconds after a write, or carry the commit LSN and only read a replica that has replayed it; a `ThreadLocal` … → **`sd-concepts#data`** [sd-data]
- [M] full-system-design-course — Load-balancing algorithms not covered: round robin, weighted, least connections (long-lived connections/WebSocket), IP hash (sticky), consistent hashing. Commonly asked → **`sd-concepts#scale-proxy`** [sd-general]
- [M] what-breaks-at-scale, case-studies-outages-reliability — Graceful degradation / load shedding: classify features by tier (checkout/auth never shed; recommendations, review badges shed first, serve cached default); under overload return 503 fast instead … → **`sd-concepts#resilience` (after)** [sd-general]
- [M] what-breaks-at-scale, 60-days Day 20 — Retry storm made concrete: 3 retries on an overloaded dependency is up to 4x load; system can stay down after traffic drops (metastable). Mitigations: full jitter, retry budget (retries <= ~10% of calls), breaker. … → **`sd-concepts#resilience`** [sd-general]
- [M] what-breaks-at-scale — Health check that lies (gray failure): `/health` green, CPU 30%, yet 504s, meaning threads are blocked on an exhausted Hikari pool or a slow dependency. Good debugging question → **`sd-concepts#observability` (quiz) or `sd-concepts#resilience`** [sd-general]
- [M] 60-days Day 26, what-breaks-at-scale — Lost cache invalidation: DB commit succeeds but `redis.del` fails -> stale for full TTL. Options: short TTL as safety net (we have), retry delete, or CDC (Debezium) / outbox-driven invalidation. Our cache-aside … → **`sd-concepts#cache-queue`** [sd-general]
- [M] 60-days Days 17/25, common-interview-questions — Backpressure via queue in flash sale: API writes to Kafka, consumers process at DB's sustainable rate, client gets "queued" + status; monitor consumer lag. Our MQ part lists "san tải đỉnh" but no … → **`sd-concepts#message-queue`** [sd-general]
- [M] 60-days Day 47 — Strangler fig: the hard part is the shared DB (use CDC/read replica first) and gateway rerouting gives instant rollback. sd-concepts#microservices covers strangler basics; add the DB entanglement point → **`sd-concepts#microservices`** [sd-general]
- [H] circuit-breaker-pattern — Slow calls must count. Resilience4j `slowCallDurationThreshold` + `slowCallRateThreshold`. Interview trap: downstream latency rises to 9.5 s under a 10 s timeout, error rate stays 0 %, breaker stays CLOSED while Tomcat threads … → **`sd-concepts#resilience`** [sd-msg]
- [H] circuit-breaker-pattern — Which exceptions count. By default every exception is recorded, so a burst of 404/400/business exceptions can open the payment breaker for everyone. Use `ignoreExceptions` (4xx, business) / `recordExceptions` (IOException, … → **`sd-concepts#resilience`** [sd-msg]
- [M] circuit-breaker-pattern — `minimumNumberOfCalls` (without it 1 failure of 1 call = 100 % and trips) and sliding window COUNT_BASED vs TIME_BASED → **`sd-concepts#resilience`** [sd-msg]
- [M] bulkhead-pattern, retry-pattern — Do not retry `CallNotPermittedException` / `BulkheadFullException` (put them in Retry `ignoreExceptions`). This pairs directly with our point that Retry wraps CB by default: without it, Retry re-hits an OPEN breaker 3 … → **`sd-concepts#resilience` (after paragraph)** [sd-msg]
- [M] bulkhead-pattern — Two bulkhead types: semaphore (caps concurrent calls on caller thread, `maxConcurrentCalls`, `maxWaitDuration`) vs thread-pool (separate pool, method returns `CompletableFuture`, caller thread freed). Keep the queue small: a 1000-slot … → **`sd-concepts#resilience`** [sd-msg]
- [M] retry-pattern — Retry amplification across a call chain: A->B->C each retrying 3 times = up to 27 calls on C for one user request. Retry at one layer only (edge) or propagate a retry budget → **`sd-concepts#resilience`** [sd-msg]
- [M] saga-pattern, resilience-patterns-payments-ticketing — Participants must be idempotent keyed by `sagaId + step` (insert into processed_command with unique key). Cancel-arrives-before-Try race: store a "pre-cancelled" tombstone so the late Reserve aborts → **`sd-concepts#saga-ops`** [sd-msg]
- [H] real-time-updates — **Short polling vs long polling vs SSE vs WebSocket is missing entirely** (only `websocket` scope in bean-lifecycle). Need: direction (SSE server→client only, WS bidirectional), SSE = one long HTTP response `text/event-stream`, … → **new section `sd-concepts#realtime`** [sd-ops]
- [M] real-time-updates — **Spring specifics.** `SseEmitter` with `onCompletion/onTimeout/onError` cleanup (registry leak otherwise), heartbeat comment shorter than the LB idle timeout (ALB 60 s), nginx `proxy_buffering off`. `@EnableWebSocketMessageBroker` + … → **same new section** [sd-ops]
- [H] observability — **SLI/SLO/SLA + error budget missing** (no lesson has them). SLI = measured (p99 latency, success rate), SLO = internal target (99.9%), SLA = contract with penalty. Error budget at 99.9% ≈ 43.8 min/month. When the budget burns fast, … → **`sd-concepts#observability`** [sd-ops]
- [H] observability — **Golden signals / RED / USE + metric types.** Golden signals: latency, traffic, errors, saturation. RED for services (rate, errors, duration), USE for resources (utilization, saturation, errors). Micrometer `Counter` (only goes up), … → **`sd-concepts#observability`** [sd-ops]
- [M] observability — **Alerting basics.** Alert on symptoms (p99, error rate tied to SLO), not causes (CPU > 80%). Use `for:` to stop flapping. Every alert must be actionable and have a runbook/owner → **`sd-concepts#observability`** [sd-ops]
- [H] log-aggregation, observability — **Practical logging rules are missing** (only "JSON log with traceId" in one bullet). Rules: - Parameterized logging `log.debug("order {}", id)` instead of concatenation. - Pass the exception as the last arg … → **`sd-concepts#observability` new part `logging` (or `exception` lesson)** [sd-ops]
- [H] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/notification-system — **Notification system** (very common for Java backend). Site: accept with Idempotency-Key, return 202, process async via queue; separate topics/worker … → **new section in sd-practice** [sd-problems]
- [H] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/dropbox , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/instagram , … → **new section in sd-practice ("upload"); sd-concepts#cache-queue has CDN as a single bullet** [sd-problems]
- [H] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/fb-news-feed , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/ticketmaster , … → **sd-concepts#sharding** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/flash-sale , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/ticketmaster — **Admission control / load shedding**: virtual waiting room (queue … → **sd-concepts#resilience** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/issue-tracker , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/yelp — **Search index sync**: SQL LIKE cannot do full-text/faceted search; sync … → **sd-concepts#outbox (one paragraph)** [sd-problems]
- [H] search-systems — **Full-text search vs `LIKE '%x%'`.** Neither phrase appears in any lesson, and "inverted index" doesn't either. Missing points: `LIKE '%bluetooth speaker%'` scans every row and has no relevance ranking. An inverted index maps term → … → **new section in sd-concepts after `data` (or a part under `cache-queue`). A one-line mention of the PostgreSQL middle ground (`tsvector`/`to_tsquery` with a GIN index, and `pg_trgm` for `%x%`) would round it out. That middle ground is my addition, not on the site** [sd-tech]
- [H] search-systems — **Keeping Elasticsearch in sync with the DB.** Three options: dual-write (partial failure leaves the two inconsistent), CDC/outbox → Kafka → indexer, nightly reindex. The DB stays the source of truth, and search is eventually consistent … → **sd-concepts#outbox (add ES as a consumer example) or the new search section** [sd-tech]
- [M] search-systems / opensearch-indexing — **`text` vs `keyword` mapping, and must vs filter.** `text` is analyzed for full-text search. `keyword` stays exact, for filters, sorting and aggregations (status, category, ids). Map an id as `keyword` even when … → **the new search section** [sd-tech]
- [M] search-systems / opensearch-query — **Deep pagination in ES.** `from: 50000, size: 10` makes every shard return 50,010 hits to the coordinator, and `index.max_result_window` defaults to 10000. Use `search_after` (+ PIT) instead, which is the same idea … → **new search section, with a cross-link from sql.ts#pagination** [sd-tech]
- [M] large-blobs + media-systems — **Async thumbnail pipeline.** An S3 event goes to a queue, a worker resizes, and the result is written to the processed bucket + DB. The worker must be idempotent, and the upload has a status field (PENDING/READY). Serve … [sd-tech]
- [M] nginx-internals — **LB algorithms**: round robin (default), weighted (canary), least connections (when request time varies), ip_hash/hash = sticky. Sticky is brittle (removing a node logs its users out), so it's better to keep sessions in Redis. No … → **sd-concepts#scale-proxy (add to the Load balancer card)** [sd-tech]

### sd-practice (28)
- [M] scaling-reads — News-feed fan-out: push (fan-out on write into each follower's Redis ZSET timeline; cheap reads, write amplification for 50M followers) vs pull (merge at read time) vs hybrid (push for normal users, pull celebrity posts at read time, … → **new section in `sd-practice`** [sd-data]
- [H] interview-framework — Time budget and pacing missing. Site: 45-min interview gives ~35 min of design → **HLD done by min 20-25 so 10-15 min remain for deep dives; top 3 functional reqs plus an explicit "out of scope" line; don't spend 10 min on upfront 5-year storage math that never changes a decision. Our 7 steps have no time guidance. — `sd-practice#framework`** [sd-general]
- [H] interview-framework — Deep-dive formula missing: (1) state the bottleneck with a number ("row lock contention at 20k QPS exhausts HikariCP"), (2) give 2-3 options from naive to strong (FOR UPDATE -> optimistic version -> conditional UPDATE / Redis … → **`sd-practice#framework`** [sd-general]
- [H] interview-framework — Quantified, per-operation NFRs instead of "fast, scalable, available": e.g. booking CP with zero double-booking and p99 < 500 ms, browsing AP with 1-2 s staleness, p99 < 150 ms. Our framework says only "chức năng và phi chức năng" → **`sd-practice#framework`** [sd-general]
- [M] interview-framework — API hygiene checklist when writing the API step: take userId from the JWT, never from the request body (IDOR/BOLA); Idempotency-Key on every mutating POST; cursor pagination on lists. All three exist in other lessons (web-vulns, … → **`sd-practice#framework` (one bullet linking rest/web-vulns)** [sd-general]
- [M] interview-framework, capacity-planning — "Estimation must drive a decision": in-context math such as "working set 50 M rows x 100 B = 5 GB fits one Redis", or "peak 50k writes/s exceeds one Postgres primary (~5-10k TPS)", so we need a queue or sharding. … → **`sd-practice#estimate`** [sd-general]
- [M] capacity-planning — Rough per-component capacity numbers for that comparison: one Postgres ~1-5k QPS (site's figure), Redis ~100k ops/s, one Spring Boot instance a few thousand to ~10-20k RPS, plus `servers = peak QPS / per-instance QPS` + headroom (run … → **`sd-practice#estimate`** [sd-general]
- [M] capacity-planning, interview-framework — Little's Law L = λ × W as an interview tool: 2,000 RPS x 50 ms = 100 concurrent; if downstream slows to 500 ms -> 1,000, past Tomcat's default 200 threads; 5,000 RPS x 4 s LLM call = 20,000 in flight -> virtual … → **`sd-practice#estimate` or `sd-concepts#resilience`** [sd-general]
- [M] capacity-planning — Utilisation knee: latency ~ S/(1-ρ); at 70% CPU queueing ~3x, 90% ~10x. Explains why "2 servers at 95% CPU for HA" fails (peak 3-5x average, plus failover). Good trap question → **`sd-practice#estimate`** [sd-general]
- [H] common-interview-questions, case-studies-architecture-scaling, 60-days Day 23 — News feed / timeline design missing entirely: fan-out on write (push into followers' Redis lists) vs on read (pull and merge), the celebrity problem, hybrid (push for normal … → **new section in `sd-practice` (or a third worked design)** [sd-general]
- [M] common-interview-questions, 60-days Days 40/56, what-breaks-at-scale stage 5 — Long-running jobs: return 202 Accepted + `Location: /jobs/{id}`, worker does the work, client polls with backoff+jitter or gets SSE/webhook; never hold the HTTP thread 45 s … → **new part in `sd-practice` or `sd-concepts#message-queue`** [sd-general]
- [M] common-interview-questions #8 — Notification system as a short worked design (event -> Kafka -> notification service -> channel by user preference, at-least-once + dedupe, retry with backoff, per-user rate limit/quiet hours, digest batching). Pieces … → **`sd-practice` (optional third design)** [sd-general]
- [M] senior-engineer-design-course — Multi-row inventory hold: a hotel booking reserves one row per night; run conditional `UPDATE ... WHERE reserved < total` over the date range and ROLLBACK if `rows_updated != nights`. Our checkout covers multi-product … → **`sd-practice#checkout`** [sd-general]
- [M] inventory-reservation-system, resilience-patterns-payments-ticketing — When the single conditional UPDATE on one row is the bottleneck (thousands/s on one product): split stock into N bucket rows or per-unit rows claimed with `FOR UPDATE SKIP LOCKED`; … → **`sd-practice#checkout`** [sd-msg]
- [M] inventory-reservation-system — Redis-hold + DB-ledger "seam": two stores without a shared transaction; Redis hold TTL expires while a slow payment is still running, the unit is sold again -> oversell; app crash between Redis decrement and DB write -> … → **`sd-practice#checkout`** [sd-msg]
- [M] long-running-tasks — **Job state machine and exactly-once claim.** A worker claims a job with `UPDATE jobs SET status='RUNNING' WHERE id=? AND status='QUEUED'`, and 0 rows means another worker already has it. Retry count leads to DEAD/DLQ. A "stuck … → **same new section** [sd-ops]
- [H] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/fb-news-feed , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/instagram — **News feed: fan-out on write vs on read vs hybrid** is missing … → **new section in sd-practice ("feed")** [sd-problems]
- [H] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/whatsapp , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/fb-live-comments , … → **new section in sd-practice ("chat") or new sd-concepts section ("realtime")** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/payment-system , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/digital-wallet , … → **sd-practice#checkout-payment (ledger + reconciliation paragraph) or a new "wallet transfer" part** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/flash-sale , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/gopuff — **Flash sale beyond the single conditional UPDATE**: sd-practice#checkout … → **sd-practice#checkout (new part "flash sale at 10x")** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/search-autocomplete — typeahead: trie with precomputed top-5 per node (O(prefix length) lookup), rebuilt offline from search logs and swapped in; client debounce (~150ms) and … → **optional new section in sd-practice** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/yelp , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/uber , … → **optional new section in sd-practice; GEO commands in redis-structures** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/amazon-shopping-cart — cart points complementing sd-practice#checkout: do not reserve stock on add-to-cart (reserve at checkout), snapshot price in cart but re-validate … → **sd-practice#checkout** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/online-auction — bidding as a hot-row exercise: accept a bid only via atomic compare (`UPDATE auction SET price=:bid, winner=? WHERE id=? AND price < :bid AND ends_at > … → **sd-practice#checkout (exercise) or new section** [sd-problems]
- [M] https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/gopuff , https://luminhkhuong.dev/technical-knowledge/system-design/problem-breakdowns/ticketmaster , … → **sd-practice#checkout** [sd-problems]
- [H] large-blobs — **Do not store files in the DB. Store bytes in object storage (S3/MinIO) and metadata + key in the DB.** Why: rows grow huge (a 4 MB image spans about 500 8 KB pages), the buffer cache fills up, WAL/replica lag rises, and backups balloon. … → **new sd-practice section "Upload ảnh/file"** [sd-tech]
- [H] large-blobs — **Presigned URL direct upload.** Flow: client asks the API → API checks auth and issues a short-lived URL (15 min, fixed key and content-type) → client PUTs straight to S3 → client tells the API it's done → API saves metadata. This keeps … → **same new section** [sd-tech]
- [M] large-blobs — **Multipart upload**: split into 5 MB parts, upload in parallel, retry only the failed part, then complete. Also mention a lifecycle rule that aborts unfinished uploads so orphaned parts get cleaned up. Same section [sd-tech]

### security (18)
- [H] GZ/spring-boot/top-spring-security-interview-questions, GZ/spring-boot/spring-boot-tricky-interview-questions-2: **writing a custom filter**, typically a hand-rolled JWT filter: extend `OncePerRequestFilter`, register with … → **`security#filter-chain` (or `lab-jwt-cache-tests#jwt`)** [iq-genz]
- [M] GZ/spring-boot/top-spring-security-interview-questions: **SpEL ownership checks** in `@PreAuthorize` (`#userId == authentication.principal.id`, `@authz.canAccess(authentication, #id)`), plus `@PostAuthorize`/`@Secured`. Only `hasRole` is shown; the IDOR … → **`security#method-security`** [iq-genz]
- [M] GZ/spring-boot/top-spring-security-interview-questions: **debugging "access denied unexpectedly"**: `logging.level.org.springframework.security=DEBUG` (or `@EnableWebSecurity(debug = true)`), check the `ROLE_` prefix and filter order → **`security#method-security` or `security#filter-chain`** [iq-genz]
- [M] security-patterns — **Ownership checks via SpEL bean (ABAC-lite).** `@PreAuthorize("@orderSecurity.canModify(authentication, #orderId)")` and `#userId == authentication.principal.id`. RBAC role explosion → attribute/ownership checks. Also: take the … → **`security#method-security`** [sd-ops]
- [H] S/cookies-vs-sessions-vs-jwt, S/authentication-authorization — **Session-based auth is never explained.** Site: login → server stores session in Redis/DB → `Set-Cookie: JSESSIONID` (opaque id, HttpOnly/Secure/SameSite) → browser auto-sends; pros instant … → **`security` new section (before `jwt`, or after `authn-authz`)** [sec-solid]
- [H] S/cookies-vs-sessions-vs-jwt, S/authentication-authorization#Q11 — **Session fixation**: attacker plants a known session id, victim logs in, attacker inherits it; fix = new id on login. Spring does it by default (`changeSessionId` on Servlet 3.1+; … → **same new section** [sec-solid]
- [H] S/web-vulnerabilities (CSRF), S/web-security-fundamentals §5, S/authentication-authorization (Secure Cookie Flags) — **How to defend CSRF when you do use cookies** is missing; lesson only says "token trong cookie thì phải chống CSRF". Need: cookie flags … → **`security#cors-csrf`** [sec-solid]
- [M] S/cookies-vs-sessions-vs-jwt (Trap 3) — **Site vs origin**: SameSite uses scheme + eTLD+1, so `evil.example.com` → `app.example.com` is same-site and SameSite does not block it; CORS uses origin. Lesson defines origin only → **`security#cors-csrf` (after the Origin bullet)** [sec-solid]
- [M] S/authentication-authorization (RBAC/ABAC, Q6) , S/interview-questions Q7 — **RBAC vs ABAC (vs ReBAC)** and Spring forms: `hasRole/hasAnyRole`, inline ownership `@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")`, ABAC via … → **`security#method-security`** [sec-solid]
- [M] S/authentication-authorization §4 — **Bearer token ≠ JWT**: Bearer is a scheme (RFC 6750); token can be opaque (validated by introspection/DB) or JWT (self-contained). Opaque vs JWT trade-off (revocable instantly vs no lookup). Not mentioned anywhere → **`security#jwt` intro** [sec-solid]
- [M] S/keys-signing-tls, S/cryptography-secure-design Q1/Q3, S/interview-questions Q8 — **Encode vs hash vs encrypt vs sign; symmetric vs asymmetric; HMAC vs digital signature** as one comparison. Lesson has "encode không phải encrypt" and HS256 vs RS256 but … → **`security#tokens` (or new short section "Mã hoá, băm, ký")** [sec-solid]
- [M] S/keys-signing-tls (TLS section, KeyStore vs TrustStore), S/interview-questions Q13-14 — **HTTPS/TLS basics** absent: what TLS gives (confidentiality, integrity, server auth; not client auth, not end-to-end past termination), handshake in a few steps … → **new section in `security` (or `microservices#config-security`)** [sec-solid]
- [M] S/keys-signing-tls (Key Rotation), S/interview-questions Q10, S/jwt-oauth2-oidc-deep-dive §1.3 — **Zero-downtime key rotation with JWKS**: publish new key first, wait ≥ cache TTL, switch signing (new `kid`), remove old key after max token TTL. Lesson … → **`security#tokens`** [sec-solid]
- [M] S/cryptography-secure-design (Secure Random) — **`SecureRandom` vs `Random`/`Math.random()`** for tokens, reset links, OTP, session ids. Absent → **`security#bcrypt` or `web-vulns#password`** [sec-solid]
- [M] S/refresh-token-security-invalidation §1-3 — **Single-device vs "log out everywhere" vs password change vs account lock**: per-device session rows; logout deletes one; global/password change revokes all rows + `revoked_before` timestamp (reject `iat <` … → **`security#tokens` or `oauth2-oidc#rotation`** [sec-solid]
- [M] spring-security, spring-exception-handling — **`@PreAuthorize` failures DO reach `@RestControllerAdvice`** (thrown inside DispatcherServlet), unlike URL-rule failures. Trap: a catch-all `@ExceptionHandler(Exception.class)` turns them into **500** … → **`security#method-security` (and note in `advice-aop#problem-detail`)** [spring-core]
- [M] spring-security, spring-framework-deep-dive — **Owner/row-level SpEL**: `@PreAuthorize("hasRole('ADMIN') or #order.ownerId == authentication.principal.id")`, `@PostAuthorize("returnObject.owner == authentication.name")`. We cover IDOR conceptually … → **`security#method-security`** [spring-core]
- [M] spring-security (cheat sheet) — **Custom JWT filter annotated `@Component` runs twice**: Boot auto-registers every `Filter` bean in the servlet container *and* you add it to the SecurityFilterChain; disable with … → **`security#jwt`** [spring-core]

### solid (3)
- [M] D/summary ("Testing is your signal") , D/single-responsibility (Testing implications) — **Hard-to-test code as a SOLID smell detector**: needs a real DB → DIP; 100-line setup → SRP; mock must stub 10 unused methods → ISP; mock throws unexpectedly → LSP; … → **`solid#playbook`** [sec-solid]
- [M] D/dependency-inversion (Hexagonal / Clean Architecture) , D/summary Q — **Ports & adapters / dependency rule**: domain owns the port interface, adapters (JPA, Stripe) implement it, dependencies point inward. Lesson's DIP already says "module cấp cao … → **`solid#dip` (after) ** [sec-solid]
- [M] D/liskov-substitution (Contract tests) , D/open-closed (contract tests) — **Abstract contract test** that every implementation extends (InMemory vs Redis cache) as the practical way to enforce LSP → **`solid#lsp` (after) or `solid#lsp-rules`** [sec-solid]

### sql (9)
- [M] advanced-sql: **OFFSET drift.** With OFFSET pages, rows inserted or deleted between page requests cause duplicated or skipped rows. Keyset is stable. We only cover OFFSET speed → **`sql#pagination`** [db-perf]
- [M] exporting-large-datasets-streaming-internals: **exporting or processing millions of rows from Java without OOM.** - `findAll()` into a `List` blows the heap. - JDBC drivers buffer the whole result by default. PostgreSQL needs `fetchSize` plus autocommit … → **new part in `sql#pagination` or `lab-jpa-perf`** [db-perf]
- [M] nosql-distributed: **NoSQL is only a list of 4 names** in `sql#nosql`. Missing: - MongoDB embed vs reference (unbounded arrays, 16 MB document limit). - Cassandra "design tables from queries", partition key and clustering key. - Quorum `W + R > N`. - … → **`sql#nosql`** [db-perf]
- [M] full-text-search: **inverted index**, and why `LIKE '%x%'` is not search (no ranking, no stemming). PostgreSQL `tsvector` + GIN vs Elasticsearch. **Keeping ES in sync with the DB** through CDC (Debezium) or outbox instead of dual-write. We only name … → **`sql#nosql`** [db-perf]
- [M] /connection-pooling "Core parameters" + Validation: **Hikari settings beyond size and timeout.** None of these are taught yet: - `max-lifetime` must be shorter than the DB's or firewall's idle-kill timeout, otherwise you get stale "connection reset" … → **`sql#hikari`** [db-tx]
- [M] /connection-pooling "Connection Hold Time": **Hold time ≠ query time.** With JpaTransactionManager the connection is taken when the transaction *begins* and is held until commit, including CPU work and DTO mapping, not only during SQL. This explains … → **`sql#hikari` (one line)** [db-tx]
- [L-M] /connection-pooling PgBouncer: **What PgBouncer does.** PG forks one process per connection (MBs of RAM each); many app pods → use PgBouncer in transaction mode. Gotcha: server-side prepared statements, session `SET`, advisory locks and LISTEN don't … → **`sql#hikari` (cheat row), optional** [db-tx]
- [H] mongodb-deep-dive — **MongoDB vs SQL choice is too thin.** sql.ts#nosql only lists the NoSQL types and has one quiz. Missing pieces: - Document model: one aggregate per document, so no JOIN is needed. - **Embed vs reference** rule: embed when the data … → **sql#nosql (add a part) or a db-design section** [sd-tech]
- [M] mongodb-deep-dive — Atomic single-doc update ops (`$inc: {stock: -1}` with a filter `stock: {$gt: 0}`) as Mongo's version of the conditional UPDATE. Write concern `majority` vs `w:1` (data loss on failover), read preference secondary = stale reads (same … → **sql#nosql (one bullet each)** [sd-tech]

### sql-dml (3)
- [M] query-optimization-beyond-indexes-upsert-traps: **UPSERT** (`INSERT ... ON CONFLICT (key) DO UPDATE/DO NOTHING` in PostgreSQL, `ON DUPLICATE KEY UPDATE` in MySQL) as the race-free answer to "check if it exists, then insert". Plus the MySQL trap: the … → **`sql-dml#insert` or `db-design#constraints`** [db-perf]
- [H] /mysql-deadlocks-gap-locks-internals Playbook 2: **Check-then-insert → unique constraint plus upsert.** We teach "UNIQUE blocks duplicates, map the error to 409" (`db-design#constraints`) but never show `INSERT ... ON CONFLICT (email) DO NOTHING / DO … → **`sql-dml#insert` (syntax) plus `db-design#constraints` (race pattern)** [db-tx]
- [M] /relational-fundamentals Q1: **DELETE vs TRUNCATE vs DROP**, a classic question. DELETE is DML: it takes a WHERE, fires triggers and can be rolled back. TRUNCATE is DDL: it empties the table fast and resets identity; it is transactional in PG but causes … → **`sql-dml#delete-returning` (cheat row)** [db-tx]

### sql-foundation (2)
- [M] /relational-fundamentals Q2: **FK actions `ON DELETE CASCADE / SET NULL / RESTRICT / NO ACTION`.** `sql-foundation#foreign-key` only says "FK blocks deleting the parent". The grep finds no `ON DELETE` anywhere. Worth contrasting with JPA `cascade = … → **`sql-foundation#foreign-key`** [db-tx]
- [M] /database-design + /relational-fundamentals Q5: **Surrogate vs natural key.** Natural keys (email, national ID) change and cascade through FKs, so prefer a surrogate PK and put UNIQUE on the natural key. Also: sequential IDs exposed in URLs invite … → **`sql-foundation#primary-key` or `sql-erd#keys-schema`** [db-tx]

### sql-optimize (1)
- [H] performance-monitoring / indexing: **how to find slow queries in production before running EXPLAIN.** PostgreSQL: `log_min_duration_statement`, `pg_stat_statements` sorted by `total_exec_time` (calls × mean, so a 40 ms query run 250k times/min beats a 3 … → **new section in `sql-optimize` (or `index#explain`)** [db-perf]

### stream (4)
- [M] java-8-tricky — **How lambdas compile**: invokedynamic plus `LambdaMetafactory`, not an anonymous inner class, so no `Outer$1.class` and `this` means the enclosing instance. grep finds no "invokedynamic" → **`stream#lambda`** [iq-java]
- [M] java-8-tricky — **`Function.andThen` vs `compose`** (`(5*2)+3=13` vs `(5+3)*2=16`). collectors.ts mentions `andThen` but not the contrast → **`stream#functional-interface`** [iq-java]
- [M] java-functional-interfaces-factory#2: **composing functional interfaces** is missing: `Function.andThen` vs `compose` (`f.andThen(g)` = g(f(x)) and `f.compose(g)` = f(g(x))), `Predicate.and/or/negate`, `Consumer.andThen`, and `Function.identity()`. The … → **`stream#functional-interface` (after-text plus one quiz on andThen vs compose order)** [j-lang]
- [M] java-interview-questions §3: **findFirst vs findAny** is absent everywhere. findAny may return any element and is cheaper in parallel; findFirst respects encounter order → **`stream#lazy` (short-circuit ops) or `optional#parallel-order`** [j-lang]

### sync (6)
- [M] GZ/java-collections-interview-questions: **`Collections.synchronizedList` and `Vector` are not "fully" thread-safe**. Compound check-then-act (`if (!contains) add`) is not atomic, and iteration needs `synchronized(list){...}`. `sync#chm-internals` … → **`sync#chm-traps` or `collections#fail-fast`** [iq-genz]
- [M] .../java/java-locks, .../java/java-aqs-internals: **synchronized lock states** (biased → lightweight CAS/spin → heavyweight OS mutex). This is still a common VN interview question. Add the modern caveat: biased locking was deprecated and disabled in JDK … → **`sync#synchronized`** [j-conc]
- [M] .../java/java-jmm-memory-model: **data race vs race condition, and atomicity does not compose.** `available` and `reserved` as two `AtomicInteger`s still break the `available + reserved == 100` invariant, and readers need the same lock. Fix: one lock … → **`sync#atomic`** [j-conc]
- [M] .../java/java-jmm-memory-model, .../low-level-design/concurrency/correctness, .../java/java-locks: **immutability and safe publication.** `final` fields are visible after the constructor ends, as long as `this` does not escape during construction. … → **`sync#happens-before` (final rule) + `sync#locks` (snapshot alternative)** [j-conc]
- [M] .../java/java-locks, .../java/java-aqs-internals: **`ReentrantLock` is non-fair by default** (barging, why it is faster), and the lock is **owned by a thread**. Calling `unlock()` from another thread (for example in a CF callback) throws … → **`sync#locks`** [j-conc]
- [M] .../interview-questions/java/concurrent-collections-tricky: **when not to use `CopyOnWriteArrayList`.** Every write is an O(n) copy and creates GC pressure; good for listener lists (read-mostly); `iterator.remove()` throws … → **`sync#chm-traps`** [j-conc]

### testing (8)
- [M] GZ/spring-boot/top-spring-security-interview-questions: **testing security** with `@WithMockUser(roles="ADMIN")`, `@WithAnonymousUser`, and `SecurityMockMvcRequestPostProcessors.jwt()`, asserting 401 vs 403. Neither name appears in `testing` or … → **`testing#webmvc`** [iq-genz]
- [H] test/testing-concepts — Test doubles taxonomy (dummy, stub, mock, spy, fake) and "mock vs stub": stub controls return values (`when().thenReturn`), mock is verified for interactions (`verify`); fake = working light implementation (in-memory repo). We … → **`testing#mockito`** [redis-api-test]
- [H] test/spring-test-annotations — JUnit 5 basics are absent from all lessons (grep: no `@BeforeEach`, `@BeforeAll`, `@ParameterizedTest`, `@CsvSource`, `@MethodSource`, `@Nested`, `assertThrows`, AssertJ). Lifecycle order, `@BeforeAll` must be static … → **new section in `testing` (before `mockito`)** [redis-api-test]
- [M] test/spring-test-annotations — Without `@ExtendWith(MockitoExtension.class)` the `@Mock` fields stay null; `verify(mock, never())`, `verifyNoInteractions`; matcher rule: mixing raw values and matchers throws `InvalidUseOfMatchersException`, use `eq()` → **`testing#mockito`** [redis-api-test]
- [M] test/wiremock — Testing outbound HTTP clients: WireMock stubs a real HTTP server, so it catches serialization, headers, status handling, timeouts; fault injection (`withFixedDelay` > client timeout, `Fault.CONNECTION_RESET_BY_PEER`), scenario … → **new section in `testing` (between `webmvc` and `testcontainers`)** [redis-api-test]
- [M] test/spring-test-annotations — Other slices and options: `@JsonTest`/`JacksonTester`, `@RestClientTest`, `@MockitoSpyBean`, `@AutoConfigureTestDatabase(replace = NONE)`, `TestEntityManager`, `webEnvironment` MOCK (default) vs RANDOM_PORT vs DEFINED_PORT … → **`testing#webmvc` / `testing#datajpa` / `testing#testcontainers`** [redis-api-test]
- [M] test/testing-concepts — Coverage is not quality: line vs branch coverage (JaCoCo), mutation testing (PIT) shows if tests catch injected bugs; "delete the test" litmus → **`testing#pyramid`** [redis-api-test]
- [M] test/blackbox-and-system-testing — Black-box vs white-box; equivalence partitioning and boundary value analysis (for range [18,65] test 17,18,19,...,64,65,66); decision tables; state transitions (DELIVERED cannot go back to PENDING). Junior-friendly … → **`testing#pyramid` (part) or new section** [redis-api-test]

### thread (4)
- [M] grokking part-1 Q11 — **`wait()` must be called inside a `while` loop** (spurious wakeups, re-check the condition), and prefer `notifyAll`. thread.ts explains wait/notify but grep finds no `while (` or "spurious" → **`thread#sleep-wait`** [iq-java]
- [M] .../low-level-design/concurrency/coordination: **`wait()` / `Condition.await()` must sit in a `while` loop, not an `if`.** Reasons: spurious wakeups, and another thread can take the item between `notify` and re-acquiring the lock. `#sleep-wait` explains … → **`thread#sleep-wait`** [j-conc]
- [M] genz-career, .../java/java-threads: **`extends Thread` vs `implements Runnable`.** Single inheritance; task separated from the worker; the same Runnable works with any executor. A classic opener. Our `#runnable-callable` compares Runnable/Callable but … → **`thread#runnable-callable`** [j-conc]
- [M] .../java/concurrency-vs-parallelism, .../system-design/concurrency-async-threading-models: **concurrency vs parallelism** (Rob Pike: structure vs simultaneous execution; one chef with 5 pots vs 5 chefs), and why it decides sizing (CPU-bound ≈ cores, … → **`thread#process-thread` (short) or `threadpool#sizing`** [j-conc]

### threadpool (5)
- [H] .../java/thread-pools-and-connection-pooling, .../java/concurrency-vs-parallelism, .../system-design/concurrency-async-threading-models: **raising Tomcat threads does not raise throughput when HikariCP is the bottleneck.** Max throughput = pool size / … → **`threadpool#sizing`** [j-conc]
- [M] same pages + genz-career: **Tomcat defaults and how overload fails.** `server.tomcat.threads.max=200`, `min-spare=10`, `max-connections=8192`, `accept-count=100`. Once all threads are busy, requests wait in max-connections and then in the backlog; after … → **`threadpool#spring` (or a new part under `#sizing`)** [j-conc]
- [M] same pages: **Little's Law `L = λ × W`** as the sizing tool (300 RPS × 50 ms = 15 concurrent threads). Our lesson only uses the Goetz `cores × (1 + W/C)` formula → **`threadpool#sizing`** [j-conc]
- [M] .../low-level-design/concurrency/scarcity: **thread-pool starvation deadlock.** A task submits a subtask to the same bounded pool and blocks on `future.get()`. If N such tasks fill the N threads, no thread is left to run the subtasks. Fix: never block … → **`threadpool#sizing` (next to bulkhead) or `deadlock#avoid`** [j-conc]
- [M] .../java/java-concurrency, genz-career: **ForkJoinPool and work-stealing.** Each worker has its own deque; idle workers steal from the tail of another worker's deque. Covers `RecursiveTask`/`RecursiveAction`, "fork one half, compute the other", and the … → **new part in `threadpool#factory` or `optional` parallel-stream section** [j-conc]

### web-vulns (6)
- [M] S/web-vulnerabilities (XSS table, Q2) — **Stored vs Reflected vs DOM-based XSS** with one example each; DOM XSS = `innerHTML`/`location.hash` with no server involvement, so server-side escaping alone does not fix it. Also rich-text input needs an HTML … → **`web-vulns#xss`** [sec-solid]
- [M] S/cookies-vs-sessions-vs-jwt (Trap 1) — **HttpOnly does not stop XSS from acting**: injected script cannot read the cookie but can still send requests with it from the victim's tab. Lesson says "Cookie đặt HttpOnly để script không đọc được session", … → **`web-vulns#xss` (after)** [sec-solid]
- [M] S/web-vulnerabilities Q6/Q9 — **Security headers + clickjacking**: CSP (incl. `frame-ancestors`), HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`; Spring Security sends most by default (`http.headers(...)`). Clickjacking (invisible … → **`web-vulns` new section or `web-vulns#xss` after** [sec-solid]
- [M] S/interview-questions Q25, S/web-vulnerabilities A04 — **Secure password-reset flow**: SecureRandom token, store hash, 15-60 min expiry, single use, rate limit, same response whether email exists (user enumeration), revoke sessions after reset. Classic … → **`web-vulns` new section (next to `password`)** [sec-solid]
- [M] S/web-vulnerabilities A07/Q11 — **Brute force / credential stuffing**: rate limit by IP and username, temporary lockout (beware lockout-as-DoS), CAPTCHA after failures, breached-password check, MFA. Lesson only says BCrypt cost makes login a DoS vector → **`web-vulns#password` (after) or same new section** [sec-solid]
- [M] S/api-security (file upload, Q3) — **File upload**: size limit, detect type from magic bytes not `Content-Type`/extension, random storage name, store outside web root / object storage, serve with `Content-Disposition: attachment`. `web-vulns#traversal` … → **`web-vulns#traversal` (after)** [sec-solid]

### (new lesson / unassigned) (3)
- [H] grokking part-5 — **PECS / wildcards**: `List<? extends Number>` lets you read but not add; `List<? super Integer>` lets you add but reads come back as Object. The classic `Collections.copy(List<? super T>, List<? extends T>)` question → **same new section** [iq-java]
- [M] collections-interview-p2 — raw type `List items = new ArrayList()` gives ClassCastException at runtime instead of a compile error; also `List<Object>` is not a supertype of `List<String>` (invariance) → **same new section** [iq-java]
- [M] java-fundamentals#6: the super type token (`new TypeReference<List<User>>(){}` in Jackson, `ParameterizedTypeReference` in Spring RestClient/WebClient) recovers erased types through an anonymous subclass. It is the practical "why does Spring need this … → **same generics section** [j-lang]

## 3. Top 15 gaps by interview value

1. **Generics** (wildcards and PECS, `List<Object>` vs `List<String>` invariance, type erasure and what it forbids, no generic arrays, `TypeReference`/`ParameterizedTypeReference`). Zero hits in any lesson. → new section in `oop` (after `#abstraction`) or a small new lesson.
2. **Java warm-up basics that juniors always get**: JVM vs JRE vs JDK and bytecode portability; `static` (blocks, init order, `ExceptionInInitializerError`); constructor rules (`this()`/`super()` first, default ctor disappears); access-modifier table with the cross-package `protected` trap; overload resolution (widening > boxing > varargs); "what's new in Java 8 / 11". → `oop` new section, `oop#encapsulation`, `oop#override-vs-overload`, `java-runtime`, `java21#versions`.
3. **Spring Data repository layer** (derived queries, `@Query` JPQL vs native and startup validation, `Page` vs `Slice` and `countQuery`, interface/DTO projections, `@CreatedDate`/`@EnableJpaAuditing`, `@PrePersist` callbacks and which bulk ops skip them, soft delete with `@SQLDelete`+`@SQLRestriction`). → new lesson or new sections in `entity-lifecycle`.
4. **Session-based login vs JWT, session fixation, and CSRF defence when cookies are used** (`JSESSIONID`, Spring Session + Redis, `SessionCreationPolicy`, `HttpOnly`/`Secure`/`SameSite`, `CookieCsrfTokenRepository` + `X-XSRF-TOKEN`). Plus custom `OncePerRequestFilter` and `@WithMockUser` tests. → `security` new section, `security#cors-csrf`, `testing`.
5. **Money with `BigDecimal`** (`0.1+0.2`, `new BigDecimal("0.1")` vs `(0.1)`, `equals` vs `compareTo` on scale, `divide` needs a `RoundingMode`). Missing although the course uses banking examples. → new section in `equals-hashcode` after `#integer-cache`.
6. **Logging and reading stack traces** (exception as the last SLF4J arg, not `ex.getMessage()`; deepest `Caused by` is the root cause; `... N more` is not truncation; level policy; runtime level change via `/actuator/loggers`; `OmitStackTraceInFastThrow`). No lesson covers logging. → new section after `exception#spring-design`.
7. **Check-then-insert race and UPSERT** (UNIQUE + `ON CONFLICT` / `ON DUPLICATE KEY`; `FOR UPDATE` cannot lock a row that does not exist; materialize write skew by locking a parent/slot row or a constraint). → `sql-dml#insert`, `db-design#constraints`, `isolation#write-skew`.
8. **Schema migrations** (Flyway naming and checksum, never edit an applied script, `ddl-auto=validate`, expand–contract, NOT NULL on a big table, batch backfill, migrate before the new app version, `lock_timeout`). → new section in `db-design`; link from `microservices#deployment`.
9. **Graceful shutdown and zero-downtime deploys** (`server.shutdown=graceful`, `timeout-per-shutdown-phase`, K8s `preStop`, grace-period formula, exec-form `ENTRYPOINT` so SIGTERM reaches the JVM). → new section in `auto-config`, link `microservices#deployment`.
10. **Thread pool vs connection pool ceiling** (more Tomcat threads do not raise throughput when Hikari is the bottleneck: 10 conns × 50 ms = 200 RPS; Little's Law `L = λ × W`; Tomcat defaults `threads.max=200`, `accept-count=100`, `max-connections=8192`; Hikari `max-lifetime`, fail-fast `connection-timeout`). → `threadpool#sizing`, `threadpool#spring`, `sql#hikari`.
11. **Kafka consumer/producer mechanics** (`auto.offset.reset` and the new-group trap, replay via `--reset-offsets`/`seek`; not calling `ack.acknowledge()` does not redeliver; async `send()` needs a callback; retries reorder unless idempotence; "why is Kafka fast"; lag monitoring; `ErrorHandlingDeserializer` for poison pills). → `kafka#delivery`, `#group`, `#producer`, `#log`, `#dlt`.
12. **`@CacheEvict` inside `@Transactional` evicts before commit**, so a concurrent reader re-caches the old row (fix: `RedisCacheManager...transactionAware()` or AFTER_COMMIT listener); plus replica-lag re-poisoning and hot keys / `MGET` / pipelining. → `redis#invalidation`, `redis-patterns#atomic`, `sd-concepts#cache-traps`.
13. **Real-time and async API patterns** (short/long polling vs SSE vs WebSocket and scaling with a pub/sub backplane; `202 Accepted` + status URL + job state machine claimed with a conditional UPDATE). Zero coverage. → new `sd-concepts` section, `rest` new section.
14. **Missing worked system designs**: news feed fan-out (write/read/hybrid, celebrity problem), chat, notification system (priority queues, provider failover), seat holds with TTL at service level, file upload via presigned URL to object storage, full-text search vs `LIKE '%x%'`. → new `sd-practice` sections.
15. **JVM production triage** ("OOMKilled with heap at 45%" = off-heap/threads, NMT, exit 137 vs Java OOM; CPU 100% runbook `top -H` → hex nid → thread dumps; strong/soft/weak/phantom refs and `WeakHashMap`; `ClassNotFoundException` vs `NoClassDefFoundError`). → `jvm#container`, `jvm#investigate`, `jvm#gc-roots`, `java-runtime#classloader`.

Next tier (not ranked): circuit breaker slow-call and exception classification (`sd-concepts#resilience`), 2PC mechanics and CQRS/event sourcing (`microservices`), load-balancing algorithms and sticky sessions (`sd-concepts#scale-proxy`), shard-key choice and virtual nodes (`sd-concepts#sharding`), finding slow queries with `pg_stat_statements` and the ESR index rule (`sql-optimize`, `index#composite`), Hibernate JDBC batching (`lab-jpa-perf`), `wait()` in a `while` loop (`thread#sleep-wait`), synchronized lock states (`sync#synchronized`), WebFlux vs MVC (`mvc-flow`), singleton `readResolve`/constructor guard (`patterns-creational#singleton`), sliding-window-counter rate limiter (`lld-1#rate-limiter`), test doubles + JUnit 5 basics + WireMock faults (`testing`), SD interview time-boxing and deep-dive answer shape (`sd-practice#framework`).

## 4. Contradictions

### Our lessons should change (confident)
- `auto-config#actuator` (line ~172, quiz ~183): "Kiểm tra phụ thuộc ngoài thuộc về readiness" (external-dependency checks belong in readiness) is too broad. Spring Boot docs advise caution and include no external checks in readiness by default; a shared DB check in readiness makes every pod unready at once and the LB drops the whole fleet. The site's "deep health check trap" is closer to right. Reword: only dependencies this instance alone can fix or route around; shared DB/broker failures should not empty the fleet.
- `jvm#generational` (line ~145): "ZGC ... generational từ Java 21" (generational since Java 21). In JDK 21 generational mode is opt-in (`-XX:+ZGenerational`); default from JDK 23 (JEP 474); non-generational removed in JDK 24.
- `isolation` (lines ~190, ~213): "readOnly ... có thể route sang read replica" (can route to a read replica). `readOnly=true` never routes by itself; it needs an `AbstractRoutingDataSource` (+ `LazyConnectionDataSourceProxy`, as `sd-concepts#data` shows). Add that condition.
- `jvm#memory-areas` says C1 shows as "tier 2", `java-runtime#jit` says "C1 là tier 3" (C1 is tier 3). Both observable, but state once: tiers 1–3 are C1, tier 4 is C2.
- `rest#versioning` (optional nuance): keep `fail-on-unknown-properties=false` globally (right), but say strictness can be applied per request DTO; a global `true` also breaks outbound clients.

### The site contradicts our lessons and our lessons are right
- `@Transactional` only works on public methods (site) vs Spring 6 supports protected/package-private on class-based proxies (`tx-proxy`, measured).
- `NESTED` works with JPA (site) vs `JpaTransactionManager` throws `NestedTransactionNotSupportedException` by default (`propagation`).
- `DISTINCT` required with JOIN FETCH (site) vs Hibernate 6 deduplicates parents itself (`n-plus-one`).
- Setter/field injection fixes circular deps (site) vs fails at startup since Boot 2.6 (`ioc#circular`).
- Auto-config via `spring.factories` (site) vs Boot 3 reads only `AutoConfiguration.imports` (`auto-config`).
- Spring singleton beans are thread-safe (site) vs not thread-safe, measured lost update (`bean-lifecycle`).
- Spring default isolation is READ_COMMITTED (site) vs `Isolation.DEFAULT` = DB default (`isolation#anomalies`).
- Retry `SERIALIZABLE`/optimistic failures inside the same `@Transactional` (site) vs retry must wrap the transaction from outside (`isolation`, `locking`).
- `acks=1` is the Kafka producer default (site) vs `acks=all` since Kafka 3.0 (`kafka#producer`).
- Dedup key = topic+partition+offset, and `existsBy` then `save` (site) vs business `eventId` with insert-first unique key (`kafka`, `sd-concepts`); a re-sent event gets a new offset, and check-then-insert races.
- Retry vs CircuitBreaker order follows annotation order (site) vs Resilience4j fixed aspect order, Retry outermost by default (`sd-concepts#resilience`).
- `@CachePut` for updates (site) vs delete-not-set cache-aside (`redis`).
- TTL jitter prevents stampede (site) vs jitter addresses avalanche; stampede needs a lock/single-flight (`sd-concepts#cache-traps`).
- ConcurrentHashMap uses Segment locks (site) vs Java 8+ CAS + per-bin `synchronized` (`sync#chm-internals`).
- HashMap treeifies at 8 nodes (site) vs when the 9th node is added (`hashmap#treeify`).
- `finalize()` removed in Java 18 (site) vs deprecated for removal, still present in 21–25 (`exception`).
- `ExecutorService.shutdown()` waits for tasks (site) vs returns immediately; use `awaitTermination` (`threadpool#shutdown`).
- `incrementAndGet` is a `lock cmpxchg` retry loop (site) vs HotSpot intrinsic `lock xadd` on x86 (`sync#atomic`).
- `volatile` bypasses CPU caches (site) vs visibility via happens-before / JIT hoisting (`sync#volatile`).
- Thread blocked on socket I/O shows WAITING (site) vs RUNNABLE (`thread#state-traps`).
- Must migrate off `synchronized` for virtual threads (site) vs pinning fixed in JDK 24 (`deadlock#pinning`).
- `merge()` is safe from blind overwrites (site) vs copies every field, nulls from partial DTOs overwrite (`entity-lifecycle`).
- Idempotency: run then `setIfAbsent`, and 409 on key reuse (site) vs claim key first, 422 on body mismatch (`rest#idempotency`, `sd-practice`).
- Webhook HMAC over body only (site) vs timestamp + body (`api-reliability`).
- Redis Cluster uses consistent hashing (site) vs 16,384 hash slots (`redis-patterns`).
- `@MockitoBean` improves context caching (site) vs different mock sets still create new contexts (`testing`).

### Site errors with no lesson conflict (do not copy when adding content)
`@Cacheable(condition="#result...")` (must be `unless`); `UPDATE ... LIMIT` on PostgreSQL; `SET NOT NULL` called fast; G1 default since 15 / Java 8–10 default Parallel (G1 default since 9); static fields in Metaspace (heap, in the `Class` mirror); jstack misses `ReentrantLock` deadlocks (it detects them); Spring `ack.acknowledge()` omission causes redelivery (it does not); sticky-assignor default claim; session-fixation default `migrateSession` (it is `changeSessionId`); `SameSite` blocks cross-origin requests and every POST is preflighted (both false); sliding-window-counter and seat-expiry sample code race; Bloom filter used to drop "duplicate" Kafka events (false positives drop real events); `KEYS` in production code.

## Notes
- Full per-batch findings (including Low items and per-page notes) were produced in a session scratchpad and are not part of the repo; this report contains all H/M items from them.
- No project files were edited.

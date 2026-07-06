# Risks And Unknowns

- Review mixed concerns in AdminImportPanelController.ts
  Type: risk
  Confidence: low
  Evidence:
  - client/src/controllers/AdminImportPanelController.ts

- Review mixed concerns in AdminUsersController.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/in/http/AdminUsersController.ts

- Review mixed concerns in AssetController.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/in/http/AssetController.ts

- Review mixed concerns in AuthController.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/in/http/AuthController.ts

- Review mixed concerns in BackendEventsController.ts
  Type: risk
  Confidence: low
  Evidence:
  - client/src/controllers/BackendEventsController.ts

- Review mixed concerns in BaseAssetWorker.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/workers/BaseAssetWorker.ts

- Review mixed concerns in CommandLineMediaProcessingService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/out/services/CommandLineMediaProcessingService.ts

- Review mixed concerns in DaemonWorker.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/services/DaemonWorker.ts

- Review mixed concerns in HttpAuthService.ts
  Type: risk
  Confidence: low
  Evidence:
  - client/src/services/api/HttpAuthService.ts

- Review mixed concerns in HttpPipelineService.ts
  Type: risk
  Confidence: low
  Evidence:
  - client/src/services/api/HttpPipelineService.ts

- Review mixed concerns in IFaceDetectionService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/ports/out/IFaceDetectionService.ts

- Review mixed concerns in IMediaProcessingService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/ports/out/IMediaProcessingService.ts

- Review mixed concerns in IOllamaService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/ports/out/IOllamaService.ts

- Review mixed concerns in ISidecarService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/ports/out/ISidecarService.ts

- Review mixed concerns in IVectorMemoryService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/ports/out/IVectorMemoryService.ts

- Review mixed concerns in IWorkerExecutionRepository.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/ports/out/IWorkerExecutionRepository.ts

- Review mixed concerns in NoopVectorMemoryService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/out/services/NoopVectorMemoryService.ts

- Review mixed concerns in OllamaService.test.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/tests/OllamaService.test.ts

- Review mixed concerns in OllamaService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/out/services/OllamaService.ts

- Review mixed concerns in PeopleController.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/in/http/PeopleController.ts

- Review mixed concerns in PipelineController.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/in/http/PipelineController.ts

- Review mixed concerns in PipelineCoordinatorService.test.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/tests/PipelineCoordinatorService.test.ts

- Review mixed concerns in PipelineCoordinatorService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/application/services/PipelineCoordinatorService.ts

- Review mixed concerns in PythonFaceDetectionService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/out/services/PythonFaceDetectionService.ts

- Review mixed concerns in QdrantVectorMemoryService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/out/services/QdrantVectorMemoryService.ts

- Review mixed concerns in ReprocessAssetsController.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/in/http/ReprocessAssetsController.ts

- Review mixed concerns in SqliteWorkerExecutionRepository.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/out/database/SqliteWorkerExecutionRepository.ts

- Review mixed concerns in useImportWorkerPolling.ts
  Type: risk
  Confidence: low
  Evidence:
  - client/src/hooks/useImportWorkerPolling.ts

- Review mixed concerns in WorkerExecution.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/domain/entities/WorkerExecution.ts

- Review mixed concerns in XmlSidecarService.ts
  Type: risk
  Confidence: low
  Evidence:
  - server/src/adapters/out/services/XmlSidecarService.ts

## Human Validation Required

- Confirm business meaning before converting observed behavior into functional documentation.
- Confirm whether states, roles, workers, event names, and pipeline names are current intended concepts or historical drift.

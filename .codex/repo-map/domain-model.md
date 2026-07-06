# Domain Model Signals

These are technical and domain-like signals found in code. They are not confirmed functional documentation.

- assets
  Type: database-table
  Confidence: high
  Evidence:
  - server/src/adapters/out/database/SqliteDatabase.ts

- faces
  Type: database-table
  Confidence: high
  Evidence:
  - server/src/adapters/out/database/SqliteDatabase.ts

- media_files
  Type: database-table
  Confidence: high
  Evidence:
  - server/src/adapters/out/database/SqliteDatabase.ts

- persons
  Type: database-table
  Confidence: high
  Evidence:
  - server/src/adapters/out/database/SqliteDatabase.ts

- sessions
  Type: database-table
  Confidence: high
  Evidence:
  - server/src/adapters/out/database/SqliteDatabase.ts

- system_events
  Type: database-table
  Confidence: high
  Evidence:
  - server/src/adapters/out/database/SqliteDatabase.ts

- users
  Type: database-table
  Confidence: high
  Evidence:
  - server/src/adapters/out/database/SqliteDatabase.ts

- worker_executions
  Type: database-table
  Confidence: high
  Evidence:
  - server/src/adapters/out/database/SqliteDatabase.ts

- AdminImportPanelController
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - client/src/controllers/AdminImportPanelController.ts

- AdminUsersController
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/in/http/AdminUsersController.ts

- AssetController
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/in/http/AssetController.ts

- AuthController
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/in/http/AuthController.ts

- BackendEventsController
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - client/src/controllers/BackendEventsController.ts

- BaseAssetWorker
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/workers/BaseAssetWorker.ts

- CommandLineMediaProcessingService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/services/CommandLineMediaProcessingService.ts

- DaemonWorker
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/services/DaemonWorker.ts

- DeleteUserUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/DeleteUserUseCase.ts

- GetAssetsUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/GetAssetsUseCase.ts

- GetSessionUserUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/GetSessionUserUseCase.ts

- HttpAuthService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - client/src/services/api/HttpAuthService.ts

- HttpPipelineService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - client/src/services/api/HttpPipelineService.ts

- IAssetRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IAssetRepository.ts

- IDeleteUserUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IDeleteUserUseCase.ts

- IEventRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IEventRepository.ts

- IFaceDetectionService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IFaceDetectionService.ts

- IFaceRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IFaceRepository.ts

- IIndexMediaUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IIndexMediaUseCase.ts

- ILoginUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/ILoginUseCase.ts

- IMediaFileRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IMediaFileRepository.ts

- IMediaProcessingService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IMediaProcessingService.ts

- ImportMediaUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/ImportMediaUseCase.ts

- IndexMediaUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/IndexMediaUseCase.ts

- IOllamaService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IOllamaService.ts

- IPeopleUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IPeopleUseCase.ts

- IPurgeMediaUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IPurgeMediaUseCase.ts

- IRegisterUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IRegisterUseCase.ts

- IReprocessAssetsUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IReprocessAssetsUseCase.ts

- ISessionRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/ISessionRepository.ts

- ISidecarService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/ISidecarService.ts

- IUpdateAvatarUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IUpdateAvatarUseCase.ts

- IUpdateUserActiveUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IUpdateUserActiveUseCase.ts

- IUpdateUserRoleUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IUpdateUserRoleUseCase.ts

- IUserRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IUserRepository.ts

- IVectorMemoryService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IVectorMemoryService.ts

- IWorkerExecutionRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IWorkerExecutionRepository.ts

- ListUsersUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/ListUsersUseCase.ts

- LoginUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/LoginUseCase.ts

- NoopVectorMemoryService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/services/NoopVectorMemoryService.ts

- OllamaService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/services/OllamaService.ts

- PeopleController
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/in/http/PeopleController.ts

- PeopleUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/PeopleUseCase.ts

- PipelineController
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/in/http/PipelineController.ts

- PipelineCoordinatorService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/services/PipelineCoordinatorService.ts

- PurgeMediaUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/PurgeMediaUseCase.ts

- PythonFaceDetectionService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/services/PythonFaceDetectionService.ts

- QdrantVectorMemoryService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/services/QdrantVectorMemoryService.ts

- RegisterUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/RegisterUseCase.ts

- ReprocessAssetsController
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/in/http/ReprocessAssetsController.ts

- ReprocessAssetsUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/ReprocessAssetsUseCase.ts

- SqliteAssetRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/database/SqliteAssetRepository.ts

- SqliteEventRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/database/SqliteEventRepository.ts

- SqliteFaceRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/database/SqliteFaceRepository.ts

- SqliteMediaFileRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/database/SqliteMediaFileRepository.ts

- SqliteSessionRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/database/SqliteSessionRepository.ts

- SqliteUserRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/database/SqliteUserRepository.ts

- SqliteWorkerExecutionRepository
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/database/SqliteWorkerExecutionRepository.ts

- UpdateAvatarUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/UpdateAvatarUseCase.ts

- UpdateUserActiveUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/UpdateUserActiveUseCase.ts

- UpdateUserRoleUseCase
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/application/use_cases/UpdateUserRoleUseCase.ts

- XmlSidecarService
  Type: model-or-coordination
  Confidence: medium
  Evidence:
  - server/src/adapters/out/services/XmlSidecarService.ts

- AdminImportPanelState
  Type: model
  Confidence: medium
  Evidence:
  - client/src/controllers/AdminImportPanelController.ts

- AdminPeoplePanelProps
  Type: model
  Confidence: medium
  Evidence:
  - client/src/components/AdminPeoplePanel.tsx

- AdminUserDTO
  Type: model
  Confidence: medium
  Evidence:
  - client/src/services/api/interfaces.ts

- AIMetadata
  Type: model
  Confidence: medium
  Evidence:
  - server/src/domain/entities/ValueObjects.ts

- AITag
  Type: model
  Confidence: medium
  Evidence:
  - server/src/domain/entities/ValueObjects.ts

- AssetDto
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IGetAssetsQuery.ts

- AssetMetadata
  Type: model
  Confidence: medium
  Evidence:
  - client/src/types/MediaAsset.ts

- AuthContextValue
  Type: model
  Confidence: medium
  Evidence:
  - client/src/context/AuthContext.tsx

- BrandLogoProps
  Type: model
  Confidence: medium
  Evidence:
  - client/src/components/BrandLogo.tsx

- CircuitPatternProps
  Type: model
  Confidence: medium
  Evidence:
  - client/src/components/CircuitPattern.tsx

- DeleteUserRequest
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IDeleteUserUseCase.ts

- DeleteUserResponse
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IDeleteUserUseCase.ts

- DetectedFace
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IFaceDetectionService.ts

- DomainEvent
  Type: model
  Confidence: medium
  Evidence:
  - shared/types/events.ts

- Event
  Type: model
  Confidence: medium
  Evidence:
  - shared/types/events.ts

- EventSubscription
  Type: model
  Confidence: medium
  Evidence:
  - client/src/controllers/BackendEventsController.ts

- ExifData
  Type: model
  Confidence: medium
  Evidence:
  - server/src/domain/entities/ValueObjects.ts

- FaceAvatarProps
  Type: model
  Confidence: medium
  Evidence:
  - client/src/components/FaceAvatar.tsx

- FaceBoundingBox
  Type: model
  Confidence: medium
  Evidence:
  - server/src/domain/entities/Face.ts

- FaceEmbeddingRow
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IFaceRepository.ts

- GalleryCardProps
  Type: model
  Confidence: medium
  Evidence:
  - client/src/components/GalleryCard.tsx

- IAssetRepository
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IAssetRepository.ts

- IAuthService
  Type: model
  Confidence: medium
  Evidence:
  - client/src/services/api/interfaces.ts

- IDeleteUserUseCase
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IDeleteUserUseCase.ts

- IEventBus
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IEventBus.ts

- IEventRepository
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IEventRepository.ts

- IFaceDetectionService
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IFaceDetectionService.ts

- IFaceRepository
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/out/IFaceRepository.ts

- IGetAssetsQuery
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IGetAssetsQuery.ts

- IGetSessionUserQuery
  Type: model
  Confidence: medium
  Evidence:
  - server/src/application/ports/in/IGetSessionUserQuery.ts

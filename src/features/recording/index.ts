// Domain

export { ElectronNativeScreenCaptureAdapter } from "./adapters/ElectronNativeScreenCaptureAdapter";
export { ElectronPermissionsAdapter } from "./adapters/ElectronPermissionsAdapter";
// Adapters
export { ElectronRecordingStorageAdapter } from "./adapters/ElectronRecordingStorageAdapter";
export { WebcamRecorderAdapter } from "./adapters/WebcamRecorderAdapter";
export * from "./domain/entities/RecordingClock";
export * from "./domain/entities/RecordingFormat";
export * from "./domain/entities/RecordingQuality";
export * from "./domain/entities/RecordingSession";
export * from "./domain/ports/PermissionsPort";
export * from "./domain/ports/RecordingStoragePort";
// Ports
export * from "./domain/ports/ScreenCapturePort";
export * from "./domain/ports/WebcamCapturePort";
// Hooks
export { useRecorder } from "./hooks/useRecorder";
export { BrowserRecordingService } from "./services/BrowserRecordingService";
export { PauseRecordingUseCase } from "./services/PauseRecordingUseCase";
export { PreparePermissionsUseCase } from "./services/PreparePermissionsUseCase";
// Services
export { StartRecordingUseCase } from "./services/StartRecordingUseCase";
export { StopRecordingUseCase } from "./services/StopRecordingUseCase";

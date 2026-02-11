/// <reference types="vite/client" />

interface PushSubscriptionOptions {
  userVisibleOnly?: boolean;
  applicationServerKey?: BufferSource | string | null;
}

interface PushManager {
  getSubscription(): Promise<PushSubscription | null>;
  subscribe(options?: PushSubscriptionOptions): Promise<PushSubscription>;
  permissionState(options?: PushSubscriptionOptions): Promise<PushPermissionState>;
}

interface ServiceWorkerRegistration {
  pushManager: PushManager;
}

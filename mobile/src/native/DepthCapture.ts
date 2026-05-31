// ============================================================
// TypeScript interface for the native LiDAR / ARCore module
// Section 7.3 - DepthCaptureModule.swift (iOS) / ARCore wrapper (Android)
//
// NOT a real native module. Stubs throw at runtime until the native
// module is linked in a bare/native build (npx expo run:ios / run:android).
// ============================================================

/** Returned by captureWithDepth(). depthData is null on non-Pro / non-ARCore devices. */
export interface DepthCaptureResult {
  /** Base64-encoded JPEG of the captured frame. */
  imageBase64: string;
  /**
   * Depth map payload from ARKit smoothedSceneDepth (iOS) or ARCore DepthImage (Android).
   * Null on devices that do not have LiDAR (iPhone < 12 Pro) or ARCore Depth support.
   */
  depthData: Record<string, unknown> | null;
}

/**
 * Trigger a camera capture that also acquires depth data when available.
 *
 * iOS:  Calls the bridged Swift DepthCaptureModule.captureWithDepth() which
 *       runs an ARWorldTrackingConfiguration with .smoothedSceneDepth semantics.
 * Android: Calls the bridged ARCore wrapper with the Depth API.
 *
 * TODO(Section 7.3) - link native module in bare workflow before calling.
 *
 * @throws {Error} Always in this stub - native module is not linked.
 */
export async function captureWithDepth(): Promise<DepthCaptureResult> {
  // TODO(Section 7.3) - replace stub with real native module call:
  //   import { NativeModules } from 'react-native';
  //   return NativeModules.DepthCaptureModule.captureWithDepth();
  throw new Error(
    'DepthCaptureModule: native module not linked. ' +
      'Run `npx expo run:ios` (or run:android) with CocoaPods installed.',
  );
}

/**
 * Check whether the current device supports LiDAR / ARCore Depth capture.
 * TODO(Section 7.3) - implement via native module; returns false as stub.
 */
export async function isDepthSupported(): Promise<boolean> {
  // TODO(Section 7.3)
  return false;
}

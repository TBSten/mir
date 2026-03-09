import type { SnippetDefinition, MessageKey } from "@tbsten/mir-core";
import { MirError } from "@tbsten/mir-core";

export interface RemotePublishPayload {
  definition: SnippetDefinition;
  files: Record<string, string>;
  force?: boolean;
}

/**
 * リモート registry に snippet を publish
 */
export async function publishToRemoteRegistry(
  registryUrl: string,
  publishToken: string,
  payload: RemotePublishPayload,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
): Promise<void> {
  const endpoint = new URL("/api/snippets", registryUrl).toString();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publishToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        // エラーボディが JSON でない場合は HTTP ステータスのみ使用
      }

      if (response.status === 409) {
        throw new MirError(t("error.snippet-already-exists", { name: payload.definition.name }));
      }
      if (response.status === 401) {
        throw new MirError(t("error.publish-auth-failed"));
      }
      if (response.status === 403) {
        throw new MirError(t("error.publish-token-invalid"));
      }
      throw new MirError(t("error.publish-failed", { error: errorMessage }));
    }

    // Success (201 Created)
  } catch (error) {
    if (error instanceof MirError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new MirError(t("error.publish-network-error", { message: error.message }));
    }
    throw error;
  }
}

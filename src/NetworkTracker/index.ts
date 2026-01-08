import { NetworkTrackerConfig, NetworkEvent } from "../types";

export default class NetworkTracker {
  private onEvent: (event: NetworkEvent) => void;
  private captureBody: boolean;
  private debug: boolean;
  private originalFetch: typeof fetch;
  private isActive: boolean = false;
  private maxBodySize: number;
  private ignoreUrls: RegExp[];

  constructor(config: NetworkTrackerConfig) {
    this.onEvent = config.onEvent;
    this.captureBody = config.captureBody ?? false;
    this.debug = config.debug ?? false;
    this.maxBodySize = config.maxBodySize ?? 10000; // 10KB default limit
    this.ignoreUrls = config.ignoreUrls ?? [];
    this.originalFetch = window.fetch.bind(window);
  }

  public start() {
    if (this.isActive) {
      if (this.debug) {
        console.log("NetworkTracker: already started");
      }
      return;
    }

    if (this.debug) {
      console.log("NetworkTracker: starting network call tracking");
    }

    this.isActive = true;
    this.#interceptFetch();
  }

  public stop() {
    if (!this.isActive) {
      if (this.debug) {
        console.log("NetworkTracker: not active");
      }
      return;
    }

    if (this.debug) {
      console.log("NetworkTracker: stopping network call tracking");
    }

    this.isActive = false;
    window.fetch = this.originalFetch;
  }

  #interceptFetch() {
    const self = this;

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const startTime = Date.now();

      const { url, method } = self.#extractUrlAndMethod(input, init);

      // Skip tracking for ignored URLs (prevents infinite loops)
      if (self.#shouldIgnoreUrl(url)) {
        return self.originalFetch(input, init);
      }

      const requestBody = self.#captureRequestBody(init);

      try {
        const response = await self.originalFetch(input, init);
        const duration = Date.now() - startTime;
        const params = self.#extractQueryParams(url);
        const responseBody = await self.#captureResponseBody(response);

        const networkEvent = self.#createNetworkEvent({
          url,
          method,
          params,
          status: response.status,
          duration,
          success: response.ok,
          requestBody,
          responseBody,
        });

        self.#sendEventAsync(networkEvent);

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        const params = self.#extractQueryParams(url);

        const networkEvent = self.#createNetworkEvent({
          url,
          method,
          params,
          status: 0,
          duration,
          success: false,
          requestBody,
          responseBody: undefined,
        });

        self.#sendEventAsync(networkEvent);

        throw error;
      }
    };
  }

  #extractUrlAndMethod(
    input: RequestInfo | URL,
    init?: RequestInit
  ): { url: string; method: string } {
    if (typeof input === "string") {
      return {
        url: input,
        method: init?.method || "GET",
      };
    } else if (input instanceof URL) {
      return {
        url: input.toString(),
        method: init?.method || "GET",
      };
    } else {
      // Request object
      return {
        url: input.url,
        method: input.method || "GET",
      };
    }
  }

  #shouldIgnoreUrl(url: string): boolean {
    for (const pattern of this.ignoreUrls) {
      if (pattern.test(url)) {
        return true;
      }
    }
    return false;
  }

  #captureRequestBody(init?: RequestInit): any {
    if (!this.captureBody || !init?.body) {
      return undefined;
    }

    try {
      if (typeof init.body === "string") {
        if (init.body.length <= this.maxBodySize) {
          try {
            return JSON.parse(init.body);
          } catch {
            return init.body;
          }
        }
        return "[Body too large to capture]";
      } else if (init.body instanceof FormData) {
        return "[FormData]";
      } else if (init.body instanceof Blob) {
        return "[Blob]";
      } else if (init.body instanceof ArrayBuffer) {
        return "[ArrayBuffer]";
      } else if (
        typeof ReadableStream !== "undefined" &&
        init.body instanceof ReadableStream
      ) {
        return "[ReadableStream]";
      } else {
        return init.body;
      }
    } catch {
      return "[Error capturing body]";
    }
  }

  async #captureResponseBody(response: Response): Promise<any> {
    if (!this.captureBody) {
      return undefined;
    }

    const contentLength = response.headers.get("content-length");
    const responseSizeEstimate = contentLength
      ? parseInt(contentLength, 10)
      : 0;

    if (responseSizeEstimate > 0 && responseSizeEstimate > this.maxBodySize) {
      return "[Response too large to capture]";
    }

    const clonedResponse = response.clone();
    try {
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const text = await clonedResponse.text();
        if (text.length <= this.maxBodySize) {
          return JSON.parse(text);
        }
        return "[Response too large to capture]";
      } else if (contentType && contentType.includes("text/")) {
        const text = await clonedResponse.text();
        if (text.length <= this.maxBodySize) {
          return text;
        }
        return "[Response too large to capture]";
      } else {
        return "[Binary content]";
      }
    } catch (err) {
      if (this.debug) {
        console.warn("NetworkTracker: failed to capture response body", err);
      }
      return "[Error capturing body]";
    }
  }

  #createNetworkEvent({
    url,
    method,
    params,
    status,
    duration,
    success,
    requestBody,
    responseBody,
  }: {
    url: string;
    method: string;
    params: Record<string, string>;
    status: number;
    duration: number;
    success: boolean;
    requestBody?: any;
    responseBody?: any;
  }): NetworkEvent {
    return {
      event: "$ul_network_request",
      properties: {
        $ul_url: url,
        $ul_method: method.toUpperCase(),
        $ul_params: params,
        $ul_status: status,
        $ul_duration: duration,
        $ul_success: success,
        ...(this.captureBody && requestBody !== undefined
          ? { $ul_request_body: requestBody }
          : {}),
        ...(this.captureBody && responseBody !== undefined
          ? { $ul_response_body: responseBody }
          : {}),
      },
    };
  }

  #sendEventAsync(event: NetworkEvent): void {
    setTimeout(() => {
      try {
        this.onEvent(event);
      } catch (err) {
        if (this.debug) {
          console.error("NetworkTracker: error in onEvent callback", err);
        }
      }
    }, 0);
  }

  #extractQueryParams(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    } catch {
      return {};
    }
  }
}

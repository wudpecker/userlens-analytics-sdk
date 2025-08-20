export function generateUuid(): string {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
    ).toString(16)
  );
}

export function getUserlensVersion(): string {
  return "0.1.63";
}

export function saveWriteCode(writeCode: string) {
  window.localStorage.setItem("$ul_WRITE_CODE", btoa(`${writeCode}:`));
}

export function getIsLocalhost(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

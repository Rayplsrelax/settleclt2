export type DynamicResourceState = "loading" | "found" | "missing";

export function hydratedDynamicCanonicalPath(
  resourcePath: string,
  state: DynamicResourceState
): string {
  return state === "missing" ? "/404" : resourcePath;
}

import type { TranslationKey } from "./locales/en";

export type ActivityTranslator = (
  key: TranslationKey,
  vars?: Record<string, string | number>
) => string;

export type StructuredActivity = {
  type: string;
  description: string;
  action?: string;
  entityName?: string;
  targetType?: string;
  completed?: boolean;
};

const TARGET_TYPE_KEYS: Record<string, TranslationKey> = {
  neighborhood: "activity.targetType.neighborhood",
  service: "activity.targetType.service",
};

function localizedTargetType(
  targetType: string | undefined,
  t: ActivityTranslator
): string {
  return t(
    targetType ? TARGET_TYPE_KEYS[targetType] ?? "activity.targetType.generic" : "activity.targetType.generic"
  );
}

export function formatActivityDescription(
  activity: StructuredActivity,
  t: ActivityTranslator
): string {
  const entity = activity.entityName?.trim();
  switch (activity.action) {
    case "stamped":
      return entity
        ? t("activity.stamped", { entity })
        : t("activity.stampedGeneric");
    case "attended":
      return entity
        ? t("activity.attended", { entity })
        : t("activity.attendedGeneric");
    case "commented": {
      const targetType = localizedTargetType(activity.targetType, t);
      return entity
        ? t("activity.commented", { targetType, entity })
        : t("activity.commentedGeneric", { targetType });
    }
    case "bingo_progress":
      if (activity.completed) {
        return entity
          ? t("activity.bingoCompleted", { entity })
          : t("activity.bingoCompletedGeneric");
      }
      return entity
        ? t("activity.bingoProgress", { entity })
        : t("activity.bingoProgressGeneric");
    default:
      return activity.description;
  }
}

export function shouldRenderActivityDetail(activity: {
  action?: string;
  detail?: string | null;
}): boolean {
  if (!activity.detail) return false;
  return !activity.action || activity.action === "commented";
}

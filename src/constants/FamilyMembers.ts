import { FamilyMember } from "@/src/redux";

// IDs of the default (seeded) family members whose names should be localized.
const DEFAULT_MEMBER_IDS = ["wife", "husband", "child", "shared"];

/**
 * Returns the display name for a family member.
 * Default seeded members (wife/husband/child/shared) are translated via i18n,
 * while custom members created by the user keep their user-entered name.
 */
export const getFamilyMemberName = (
  member: FamilyMember,
  t: (key: string) => string,
): string => {
  if (DEFAULT_MEMBER_IDS.includes(member.id)) {
    return t(`familyMembers.defaultNames.${member.id}`);
  }
  return member.name;
};

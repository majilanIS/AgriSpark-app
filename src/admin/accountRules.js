const normalizeText = (value) => String(value ?? "").trim();

export const USER_TYPES = {
  ADMIN: "admin",
  FARMER: "farmer",
  BUYER: "buyer",
};

export const ACCOUNT_STATES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

export const splitAccountRole = (roleValue) => {
  const value = normalizeText(roleValue).toLowerCase();

  if (value === USER_TYPES.ADMIN) {
    return { userType: USER_TYPES.ADMIN, accountState: ACCOUNT_STATES.ACTIVE };
  }

  const [rawUserType = USER_TYPES.BUYER, rawState = ACCOUNT_STATES.ACTIVE] = value.split("_");
  const userType = [USER_TYPES.FARMER, USER_TYPES.BUYER].includes(rawUserType) ? rawUserType : USER_TYPES.BUYER;
  const accountState = rawState === ACCOUNT_STATES.INACTIVE ? ACCOUNT_STATES.INACTIVE : ACCOUNT_STATES.ACTIVE;

  return { userType, accountState };
};

export const composeAccountRole = (userType, accountState) => {
  const safeUserType = [USER_TYPES.FARMER, USER_TYPES.BUYER, USER_TYPES.ADMIN].includes(normalizeText(userType).toLowerCase())
    ? normalizeText(userType).toLowerCase()
    : USER_TYPES.BUYER;
  const safeState = normalizeText(accountState).toLowerCase() === ACCOUNT_STATES.INACTIVE
    ? ACCOUNT_STATES.INACTIVE
    : ACCOUNT_STATES.ACTIVE;

  if (safeUserType === USER_TYPES.ADMIN) {
    return USER_TYPES.ADMIN;
  }

  return safeState === ACCOUNT_STATES.ACTIVE ? safeUserType : `${safeUserType}_${safeState}`;
};

export const isRestrictedAccount = (roleValue) => {
  const { accountState } = splitAccountRole(roleValue);
  return accountState === ACCOUNT_STATES.INACTIVE;
};

export const blocksLogin = (roleValue) => {
  return isRestrictedAccount(roleValue);
};

export const getAccountStateLabel = (accountState) => {
  if (accountState === ACCOUNT_STATES.INACTIVE) return "Inactive";
  return "Active";
};

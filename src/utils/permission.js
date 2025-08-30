// src/permissions/permissions.js
import accessControl from './accessControl';

export function canAccess(role, path) {
  return accessControl[role]?.includes(path) ?? false;
}
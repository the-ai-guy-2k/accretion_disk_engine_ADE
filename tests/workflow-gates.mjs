export function canEnterPublishQueue(status) {
  return status === "approved";
}

export function isTerminalPublished(status) {
  return status === "PUBLISHED";
}

export function canHandToAdapter(status) {
  return status === "PENDING";
}

export function canConfirmOrFail(status) {
  return status === "READY";
}

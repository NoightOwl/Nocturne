const state = {
  report: null,
};

export function setReport(report) {
  state.report = report;
}

export function getReport() {
  return state.report;
}

export function clearReport() {
  state.report = null;
}

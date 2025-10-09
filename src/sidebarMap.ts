export function mapSidebarCommand(input: string): string | undefined {
  const lower = input.toLowerCase();
  if (/(command history|history sidebar|show command history|see command history|open command history|nlc history|natural language command history)/.test(lower)) {
    return 'commandHistory.focus';
  }
  if (/(explorer|file ?explorer|show files|see files|open explorer)/.test(lower)) { return 'workbench.view.explorer'; }
  if (/(extension|marketplace|show extensions|see extensions|open extensions)/.test(lower)) { return 'workbench.view.extensions'; }
  if (/(source control|git|scm|show source|see source|open source)/.test(lower)) { return 'workbench.view.scm'; }
  if (/(debug|run|show debug|see debug|open debug|show run|see run|open run)/.test(lower)) { return 'workbench.view.debug'; }
  if (/(test|testing|show test|see test|open test)/.test(lower)) { return 'workbench.view.testing'; }
  if (/(github|pull request|pr|show github|see github|open github)/.test(lower)) { return 'github.pullRequests.explorer'; }
  if (/(remote|remote explorer|show remote|see remote|open remote)/.test(lower)) { return 'workbench.view.remote'; }
  return undefined;
}
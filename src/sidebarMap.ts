export function mapSidebarCommand(input: string): string | undefined {
  const lower = input.toLowerCase();
  if (/(open file menu|show file menu|file menu|focus file menu|file dropdown|file top menu)/.test(lower)) {
    return 'natural-language-commands.fileMenu';
  }
  if (/(open (the )?terminal menu( on the top)?|show (the )?terminal menu( on the top)?|terminal menu( on the top)?|focus (the )?terminal menu( on the top)?|terminal dropdown|terminal top menu|top terminal menu|terminal menu at the top|the terminal menu on the top)/.test(lower)) {
    return 'natural-language-commands.terminalMenu';
  }
  if (/(what can i say|examples|show examples|help|show help|show natural commands|show natural language commands|show command examples)/.test(lower)) {
    return 'natural-language-commands.examples';
  }
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
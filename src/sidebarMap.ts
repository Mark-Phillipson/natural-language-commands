export function mapSidebarCommand(input: string): string | undefined {
  // DEBUG: Log the input and lower-case version
  // Remove this in production
  // eslint-disable-next-line no-console
  console.log('[NLC DEBUG] mapSidebarCommand input:', input);
  // eslint-disable-next-line no-console
  console.log('[NLC DEBUG] mapSidebarCommand lower:', input.toLowerCase());
  const lower = input.toLowerCase();
    // Map search-related commands to nlc.searchFiles
    if (/(search for|find all|global search|find files|search sidebar|find .* files|search .* files|find .*\.\w+ files|search .*\.\w+ files)/.test(lower)) {
      return 'nlc.searchFiles';
    }
  if (/(please )?(show|list|display|see|focus|open|choose|switch)( all)?( my)? sidebars?( list)?( picker)?/.test(lower)) {
    return 'nlc.showSidebars';
  }
  // Catch-all: if the phrase contains 'sidebar' or 'sidebars', show the picker
  if (lower.includes('sidebar')) {
    return 'nlc.showSidebars';
  }
  if (/(open (?:the )?edit menu|show (?:the )?edit menu|(?:the )?edit menu|focus (?:the )?edit menu|edit top menu|edit dropdown)/.test(lower)) {
    return 'nlc.editMenu';
  }
  if (/(open (?:the )?selection menu|show (?:the )?selection menu|(?:the )?selection menu|focus (?:the )?selection menu|selection top menu|selection dropdown)/.test(lower)) {
    return 'nlc.selMenu';
  }
  if (/(open (?:the )?view menu|show (?:the )?view menu|(?:the )?view menu|focus (?:the )?view menu|view top menu|view dropdown)/.test(lower)) {
    return 'nlc.viewMenu';
  }
  if (/(open (?:the )?go menu|show (?:the )?go menu|(?:the )?go menu|focus (?:the )?go menu|go top menu|go dropdown)/.test(lower)) {
    return 'nlc.goMenu';
  }
  if (/(open (?:the )?run menu|show (?:the )?run menu|(?:the )?run menu|focus (?:the )?run menu|run top menu|run dropdown)/.test(lower)) {
    return 'nlc.runMenu';
  }
  if (/(open (?:the )?help menu|show (?:the )?help menu|(?:the )?help menu|focus (?:the )?help menu|help top menu|help dropdown)/.test(lower)) {
    return 'nlc.helpMenu';
  }
  if (/(open (?:the )?file menu|show (?:the )?file menu|(?:the )?file menu|focus (?:the )?file menu|file dropdown|file top menu)/.test(lower)) {
    return 'nlc.fileMenu';
  }
  if (/(open (?:the )?terminal menu( on the top)?|show (?:the )?terminal menu( on the top)?|(?:the )?terminal menu( on the top)?|focus (?:the )?terminal menu( on the top)?|terminal dropdown|terminal top menu|top terminal menu|terminal menu at the top|the terminal menu on the top)/.test(lower)) {
    return 'nlc.termMenu';
  }
  if (/(what can i say|examples|show examples|(?:the )?help|show (?:the )?help|show natural commands|show natural language commands|show command examples)/.test(lower)) {
  return 'natural-language-commands.examples';
  }
  if (/(command history|history sidebar|show command history|see command history|open command history|nlc history|natural language command history)/.test(lower)) {
    return 'commandHistory.focus';
  }
  if (/(problems|problem panel|problems panel|show problems|see problems|open problems|focus problems|problems view|show the problems|see the problems|open the problems|focus the problems)/.test(lower)) {
    return 'workbench.actions.view.problems';
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
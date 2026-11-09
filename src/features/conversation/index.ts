/**
 * Conversation Module
 * Conversation workspace features including chats, conversations, questionnaires, and workflows.
 */

// Re-export conversation features
export * from './chats';
export * from './pages';
export * from './questionnaire';

// Conversation page schemas + shared cell renderers.
export * from './components/participant-cell';

// Module metadata
export const conversationModuleId = 'conversation' as const;
export const conversationModuleName = 'Conversation Workspace';
export const conversationModuleDescription =
  'Lists, inspectors, and chat operations for conversation workflows';

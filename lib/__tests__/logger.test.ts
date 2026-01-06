import { describe, test, expect } from '@jest/globals';
import { logError, logInfo, logWarning, logDebug } from '../logger';

describe('Logger', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  test('logError should log errors with context', () => {
    const error = new Error('Test error');
    const context = { userId: '123', action: 'test' };
    
    logError(error, context);
    
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('logInfo should log information messages', () => {
    const message = 'Test info message';
    const context = { userId: '123' };
    
    logInfo(message, context);
    
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('logWarning should log warning messages', () => {
    const message = 'Test warning';
    const context = { field: 'email' };
    
    logWarning(message, context);
    
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  test('logDebug should log debug messages', () => {
    const message = 'Debug info';
    const context = { step: 1 };
    
    logDebug(message, context);
    
    expect(consoleDebugSpy).toHaveBeenCalled();
  });

  test('should handle logging without context', () => {
    logInfo('Simple message');
    
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});

/*
 * Keyman is copyright (C) SIL International. MIT License.
 * 
 * PrivacyConsent.m
 * TestInputMethod2
 * 
 * Created by Shawn Schantz on 2022-09-22.
 * 
 * Used to determine if the user has provided consent to the services needed for key manipulation, and, if not, to request that consent.
 * For versions of macOS prior to 10.15, requires Accessibility access.
 * For 10.15 and later, requires PostEvent access, which is also presented to the user
 * as a need for Accessibility.
 * Both Accessibility and PostEvent encapsulate ListenEvent (or Keyboard Monitoring)
 * permission, so that access is not explicitly needed as long as one of
 * the others is provided first.
 */

#import "PrivacyConsent.h"

@implementation PrivacyConsent

+ (PrivacyConsent *)shared
{
    static PrivacyConsent *shared = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      shared = [[PrivacyConsent alloc] init];
    });
    return shared;
}

- (BOOL)checkAccessibility
{
  BOOL hasAccessibility = NO;

  NSLog(@"checkAccessibility called");
  
  hasAccessibility = AXIsProcessTrusted();
  NSLog(@"  hasAccessibility: %@",hasAccessibility ? @"YES" : @"NO");
  return hasAccessibility;
}

- (void)requestPrivacyAccess:(void (^)(void))completionHandler
{
  _handler = completionHandler;
  BOOL hasAccessibility = NO;

  NSLog(@"requestPrivacyAccess called");
  
  // check if we already have accessibility
  if (@available(macOS 10.15, *)) {
    hasAccessibility = [self checkPostEventAccess];
  } else {
    hasAccessibility = [self checkAccessibility];
  }
  
  if (hasAccessibility) {
    NSLog(@"already have Accessibility: no need to make request.");
  } else {
    NSLog(@"do not have Accessibility, present Privacy Dialog");
    [self showPrivacyDialog];
  }
}

- (void)requestAccessibility
{
  NSLog(@"requestAccessibility called");

  NSDictionary *options = @{(id)CFBridgingRelease(kAXTrustedCheckOptionPrompt): @YES};
  BOOL hasAccessibility = AXIsProcessTrustedWithOptions((CFDictionaryRef)options);
  NSLog(@"  hasAccessibility: %@",hasAccessibility ? @"YES" : @"NO, requesting...");
}

- (NSWindowController *)privacyDialog {
  NSLog(@"privacyDialog getter called");
  if (!_privacyDialog) {
        _privacyDialog = [[PrivacyWindowController alloc] initWithWindowNibName:@"PrivacyWindowController"];
    NSLog(@"privacyDialog created");
    [self configureDialogForOsVersion];
  }

  return _privacyDialog;
}

- (void)configureDialogForOsVersion {

  if (@available(macOS 10.15, *)) {
    [self configureDialogForCatalinaAndLater];
  } else {
    [self configureDialogForPreCatalina];
  }
}

- (void)configureDialogForPreCatalina {
  void (^consentPrompt)(void) = ^(void) {
    NSLog(@"block executed!");
    [self requestAccessibility];
    
    NSLog(@"calling completionHandler");
    if (self.handler) {
      self.handler();
    }
  };
  [_privacyDialog setConsentCallback:consentPrompt];
}

- (void)configureDialogForCatalinaAndLater {
  void (^consentPrompt)(void) = ^(void) {
    NSLog(@"block executed!");
    [self requestPostEventAccess];
    
    NSLog(@"calling completionHandler");
    if (self.handler) {
      self.handler();
    }
  };
  [_privacyDialog setConsentCallback:consentPrompt];
}

- (void)showPrivacyDialog {
    NSLog(@"showPrivacyDialog called");
    [[self.privacyDialog window] setLevel:NSModalPanelWindowLevel];
    [[self.privacyDialog window] makeKeyAndOrderFront:nil];
}

/*
- (BOOL)checkListenEventAccess
{
   NSLog(@"checkListenEventAccess called");
  BOOL hasAccess = NO;
  
  // below requests "Input Monitoring"
  if (@available(macOS 10.15, *)) {
    hasAccess = IOHIDRequestAccess(kIOHIDRequestTypeListenEvent);
    
    NSLog(@"has listenEvent access = %d", hasAccess);
  } else {
    NSLog(@"macOS version is before 10.15");
  }
  
  return hasAccess;
}

- (BOOL)checkPostEventAccess
{
  BOOL hasAccess = NO;
  
  NSLog(@"checkPostEventAccess called");
  
  if (@available(macOS 10.15, *)) {
    hasAccess = IOHIDRequestAccess(kIOHIDRequestTypePostEvent);
    
    NSLog(@"has postEvent access = %d", hasAccess);
  } else {
    NSLog(@"macOS version is before 10.15");
  }
  return hasAccess;
}
*/

- (BOOL)checkListenEventAccess
{
  BOOL hasAccess = NO;
  
  NSLog(@"checkListenEventAccess called");
  
  // below checks for ListenEvent access
  if (@available(macOS 10.15, *)) {
    hasAccess = CGPreflightListenEventAccess();
    
    NSLog(@"checkListenEventAccess() returned %@", hasAccess ? @"YES" : @"NO");
  } else {
    NSLog(@"macOS version is before 10.15");
  }
  return hasAccess;
}

- (BOOL)checkPostEventAccess
{
  BOOL hasAccess = NO;
  
  NSLog(@"checkPostEventAccess called");
  
  // below checks for PostEvent access
  if (@available(macOS 10.15, *)) {
    hasAccess = CGPreflightPostEventAccess();
    
    NSLog(@"checkPostEventAccess() returned %@", hasAccess ? @"YES" : @"NO");
  } else {
    NSLog(@"macOS version is before 10.15");
  }
  return hasAccess;
}

- (BOOL)requestListenEventAccess
{
  BOOL granted = NO;
  
  NSLog(@"requestListenEventAccess called");
  
  if (@available(macOS 10.15, *)) {
    granted = CGRequestListenEventAccess();
    
    NSLog(@"requestListenEventAccess() returned %@", granted ? @"YES" : @"NO");
  } else {
    NSLog(@"macOS version is before 10.15");
  }
  return granted;
}


- (BOOL)requestPostEventAccess
{
  BOOL granted = NO;
  
  NSLog(@"requestPostEventAccess called");
  
  if (@available(macOS 10.15, *)) {
    granted = CGRequestPostEventAccess();
    
    NSLog(@"requestPostEventAccess() returned %@", granted ? @"YES" : @"NO");
  } else {
    NSLog(@"macOS version is before 10.15");
  }
  return granted;
}


@end

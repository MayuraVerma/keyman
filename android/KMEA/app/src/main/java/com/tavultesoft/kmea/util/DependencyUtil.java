/**
 * Copyright (C) 2022 SIL International. All rights reserved.
 */

package com.tavultesoft.kmea.util;

public final class DependencyUtil {
  private static final String TAG = "DependencyUtil";

  public enum LibraryType {
    SENTRY,
    QRCODE;

    public static LibraryType fromString(String library) {
      if(library == null) return SENTRY;
      switch(library) {
        case "sentry": return SENTRY;
        case "qrcode": return QRCODE;
      }
      return SENTRY;
    }

    public String toString()  {
      String libraries[] = { "io.sentry.Sentry", "net.glxn.qrgen.android.QRCode" };
      return libraries[this.ordinal()];
    }
  };

  private static boolean libraryExists[] = {true, true};

  /**
   * Utility to determine if a dependency library is available in an app
   * @param library - LibraryType enum of the library to check: SENTRY or QRCODE
   * @return boolean - true if the library exists
   */
  public static boolean libraryExists(LibraryType library) {
    // If library is known not to exist, return false
    if (!libraryExists[library.ordinal()]) {
      return libraryExists[library.ordinal()];
    }

    try {
      Class.forName(library.toString());
      return true;
    } catch (ClassNotFoundException e) {
      // Intentionally not sending Exception to Sentry because 3rd party apps may not include the dependency library
      libraryExists[library.ordinal()] = false;
      return false;
    }
  }

}
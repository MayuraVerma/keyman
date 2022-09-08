/**
 * Copyright (C) 2020 SIL International. All rights reserved.
 */

package com.tavultesoft.kmea.util;

import java.util.ArrayList;

public final class BCP47 {
  /**
   * Utility to compare two language ID strings
   * @param id1 Language ID 1
   * @param id2 Language ID 2
   * @return true if the two strings are case-insensitive equal
   */
  public static boolean languageEquals(String id1, String id2) {
    if (id1 == null || id2 == null) {
      return false;
    }

    return id1.equalsIgnoreCase(id2);
  }

  /**
   * Utility to modify languageList.
   * If languageID exists in the list, remove it. Otherwise, add languageID to the list.
   * @param languageList
   * @param languageID
   */
  public static void toggleLanguage(ArrayList<String> languageList, String languageID) {
    if (languageList != null) {
      if (languageList.size() == 0) {
        languageList.add(languageID.toLowerCase());
        return;
      }

      boolean languageExists = false;
      int index = 0;
      // See if languageID already exists in the languageList
      for (String l: languageList) {
        if (languageEquals(l, languageID)) {
          languageExists = true;
          break;
        }
        index++;
      }

      if (languageExists && index < languageList.size()) {
        languageList.remove(index);
      } else {
        languageList.add(languageID.toLowerCase());
      }
    }
  }
}
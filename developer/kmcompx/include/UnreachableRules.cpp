# pragma once


#include "../../../core/src/kmx/kmx_processevent.h"       // _S2 included before all to prevent use of legacy_kmx_file
#include "../../../../developer/kmcompx/include/pch.h"              // _S2 #include "pch"
#include "../../../../developer/kmcompx/include/Compfile.h"         // _S2 #include <Compfile.h>
#include "../../../../developer/kmcompx/include/compiler.h"         // _S2 #include <compiler.h>
#include "../../../../developer/kmcompx/include/comperr.h"          // _S2 #include <comperr.h>
#include "../../../../developer/kmcompx/include/kmcmpdll.h"         // _S2 #include <kmcmpdll.h>
/*

#include "pch.h"
#include <compfile.h>
#include <compiler.h>
#include <comperr.h>
#include <kmcmpdll.h>

#include <vkeys.h>
*/
#include <unordered_map>
#include <unordered_set>
#include <string>
#include <sstream>

#include "UnreachableRules.h"

std::wstring MakeHashKeyFromFileKey(PFILE_KEY kp) {
  std::wstringstream key;
  key << kp->Key << "," << kp->ShiftFlags << ",";
  if (kp->dpContext) key << kp->dpContext;
  return key.str();
}

KMX_DWORD VerifyUnreachableRules(PFILE_GROUP gp) {
  PFILE_KEY kp = gp->dpKeyArray;
  KMX_DWORD i;

  std::unordered_map<std::wstring, FILE_KEY> map;
  std::unordered_set<int> reportedLines;

  for (i = 0; i < gp->cxKeyArray; i++, kp++) {
    std::wstring key = MakeHashKeyFromFileKey(kp);
    if (map.count(key) > 0) {
      FILE_KEY const & k1 = map.at(key);
      if (kp->Line != k1.Line && reportedLines.count(kp->Line) == 0) {
        reportedLines.insert(kp->Line);
        currentLine = kp->Line;
        // _S2 needs to be added 
        //sprintf(ErrExtra, "  character offset:%d", ErrChr);            // _S2 wsprintf(ErrExtra, "Overridden by rule on line %d", k1.Line);
        AddWarning(CHINT_UnreachableRule);
      }
    }
    else {
      map.insert({ key, *kp });
    }
  }

  return CERR_None;
}
